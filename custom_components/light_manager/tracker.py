"""Track the last Home Assistant scene applied per area and dim it relatively."""

from __future__ import annotations

import asyncio
import logging
import time
from collections import Counter, deque
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ATTR_TRANSITION,
)
from homeassistant.components.light import (
    DOMAIN as LIGHT_DOMAIN,
)
from homeassistant.const import (
    ATTR_ENTITY_ID,
    SERVICE_TURN_OFF,
    SERVICE_TURN_ON,
    STATE_OFF,
    STATE_ON,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import (
    CALLBACK_TYPE,
    Context,
    Event,
    EventStateChangedData,
    HomeAssistant,
    State,
    callback,
)
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import TrackStates, async_track_state_change_filtered
from homeassistant.helpers.storage import Store

from .const import (
    BRIGHTNESS_TOLERANCE,
    COMMAND_GRACE_SECONDS,
    EVENT_SCENE_RELOADED,
    HA_SCENE_PLATFORM_DATA,
    SAVE_DELAY,
    STORAGE_KEY,
    STORAGE_VERSION,
)

_LOGGER = logging.getLogger(__name__)

SCENE_DOMAIN = "scene"
_INVALID_STATES = (STATE_UNAVAILABLE, STATE_UNKNOWN)


@dataclass
class TrackedLight:
    """A light of the active scene: its brightness at 100 % and whether it is on."""

    baseline: int
    on: bool

    def target(self, factor: float) -> int:
        """Brightness to send for the given dim factor."""
        return max(1, min(255, round(self.baseline * factor)))


@dataclass
class AreaScene:
    """The scene last applied to an area, and how far it is dimmed."""

    scene_entity_id: str
    activated_at: str
    lights: dict[str, TrackedLight]
    factor: float = 1.0
    modified: bool = False

    def as_dict(self) -> dict[str, Any]:
        """Serialise for the store."""
        return {
            "scene_entity_id": self.scene_entity_id,
            "activated_at": self.activated_at,
            "factor": self.factor,
            "modified": self.modified,
            "lights": {
                eid: {"baseline": tl.baseline, "on": tl.on}
                for eid, tl in self.lights.items()
            },
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AreaScene:
        """Deserialise from the store."""
        return cls(
            scene_entity_id=data["scene_entity_id"],
            activated_at=data["activated_at"],
            factor=float(data["factor"]),
            modified=bool(data["modified"]),
            lights={
                eid: TrackedLight(baseline=int(tl["baseline"]), on=bool(tl["on"]))
                for eid, tl in data["lights"].items()
            },
        )


@callback
def async_scene_light_targets(
    hass: HomeAssistant, scene_entity_id: str
) -> dict[str, TrackedLight] | None:
    """Return the lights a Home Assistant scene sets, with their target brightness.

    Returns None for scenes that aren't HA-native (e.g. Hue) or were created
    with scene.create. Reads the scene platform's internal config: HA has no
    public API for a scene's target states.
    """
    platform = hass.data.get(HA_SCENE_PLATFORM_DATA)
    if platform is None:
        return None
    entity = platform.entities.get(scene_entity_id)
    if entity is None or getattr(entity, "from_service", False):
        return None
    try:
        states: dict[str, State] = entity.scene_config.states
    except AttributeError:
        _LOGGER.warning(
            "Cannot read the config of %s: Home Assistant's scene internals changed",
            scene_entity_id,
        )
        return None

    targets: dict[str, TrackedLight] = {}
    for eid, state in states.items():
        if not eid.startswith(f"{LIGHT_DOMAIN}."):
            continue
        on = state.state == STATE_ON
        brightness = state.attributes.get(ATTR_BRIGHTNESS)
        baseline = int(brightness) if on and brightness else 255
        targets[eid] = TrackedLight(baseline=max(1, min(255, baseline)), on=on)
    return targets


class SceneTracker:
    """Keeps the active scene per area and applies dim factors to its lights."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialise."""
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._areas: dict[str, AreaScene] = {}
        # light entity id -> areas whose active scene contains it
        self._light_areas: dict[str, set[str]] = {}
        self._own_contexts: deque[str] = deque(maxlen=128)
        self._busy_until: dict[str, float] = {}
        self._area_listeners: dict[str, list[Callable[[], None]]] = {}
        self._areas_changed_listeners: list[Callable[[], None]] = []
        self._unsubs: list[CALLBACK_TYPE] = []

    # --- lifecycle ---------------------------------------------------------

    async def async_load(self) -> None:
        """Restore tracked scenes from storage."""
        data = await self._store.async_load() or {}
        for area_id, area_data in data.get("areas", {}).items():
            try:
                self._areas[area_id] = AreaScene.from_dict(area_data)
            except KeyError, TypeError, ValueError:
                _LOGGER.warning("Dropping unreadable stored state for area %s", area_id)
        self._rebuild_light_index()

    @callback
    def async_start(self) -> None:
        """Start listening to scene and light changes."""
        tracker = async_track_state_change_filtered(
            self.hass,
            TrackStates(False, set(), {SCENE_DOMAIN, LIGHT_DOMAIN}),
            self._async_on_state_change,
        )
        self._unsubs.append(tracker.async_remove)
        self._unsubs.append(
            self.hass.bus.async_listen(
                EVENT_SCENE_RELOADED, self._async_on_scene_reload
            )
        )
        self._unsubs.append(
            self.hass.bus.async_listen(
                er.EVENT_ENTITY_REGISTRY_UPDATED, self._async_on_registry_update
            )
        )
        self._unsubs.append(
            self.hass.bus.async_listen(
                ar.EVENT_AREA_REGISTRY_UPDATED, self._async_on_registry_update
            )
        )

    @callback
    def async_stop(self) -> None:
        """Stop listening."""
        while self._unsubs:
            self._unsubs.pop()()

    async def async_save_now(self) -> None:
        """Write pending state to storage (on unload)."""
        await self._store.async_save(self._data_to_save())

    # --- queries -----------------------------------------------------------

    def get(self, area_id: str) -> AreaScene | None:
        """Return the tracked scene of an area."""
        return self._areas.get(area_id)

    @callback
    def async_scene_areas(self) -> set[str]:
        """Areas that have a HA scene or a tracked scene: each gets a dimmer."""
        areas = set(self._areas)
        platform = self.hass.data.get(HA_SCENE_PLATFORM_DATA)
        if platform is not None:
            for scene_entity_id in list(platform.entities):
                targets = async_scene_light_targets(self.hass, scene_entity_id)
                if targets and (area := self._resolve_area(scene_entity_id, targets)):
                    areas.add(area)
        area_reg = ar.async_get(self.hass)
        return {area_id for area_id in areas if area_reg.async_get_area(area_id)}

    def is_on(self, area_id: str) -> bool:
        """Whether any light of the area's scene is on."""
        if (area := self._areas.get(area_id)) is None:
            return False
        for eid, tl in area.lights.items():
            state = self.hass.states.get(eid)
            if tl.on and state is not None and state.state == STATE_ON:
                return True
        return False

    # --- listeners ---------------------------------------------------------

    @callback
    def async_add_area_listener(
        self, area_id: str, listener: Callable[[], None]
    ) -> CALLBACK_TYPE:
        """Call listener when the area's scene, factor or lights change."""
        listeners = self._area_listeners.setdefault(area_id, [])
        listeners.append(listener)
        return lambda: listeners.remove(listener)

    @callback
    def async_add_areas_changed_listener(
        self, listener: Callable[[], None]
    ) -> CALLBACK_TYPE:
        """Call listener when the set of areas with scenes may have changed."""
        self._areas_changed_listeners.append(listener)
        return lambda: self._areas_changed_listeners.remove(listener)

    @callback
    def _notify(self, area_id: str) -> None:
        for listener in list(self._area_listeners.get(area_id, ())):
            listener()

    @callback
    def _notify_areas_changed(self) -> None:
        for listener in list(self._areas_changed_listeners):
            listener()

    # --- commands ----------------------------------------------------------

    async def async_turn_on(
        self,
        area_id: str,
        factor: float | None = None,
        transition: float | None = None,
    ) -> None:
        """Set the scene's lights to baseline x factor (turning them on)."""
        if (area := self._areas.get(area_id)) is None:
            _LOGGER.warning("No scene has been applied to area %s yet", area_id)
            return
        if factor is not None:
            area.factor = max(1 / 255, min(1.0, factor))
            self._schedule_save()
        calls = []
        for eid, tl in area.lights.items():
            if not tl.on or not self._available(eid):
                continue
            data: dict[str, Any] = {
                ATTR_ENTITY_ID: eid,
                ATTR_BRIGHTNESS: tl.target(area.factor),
            }
            if transition is not None:
                data[ATTR_TRANSITION] = transition
            calls.append((SERVICE_TURN_ON, data))
        await self._async_call(calls, transition)
        self._notify(area_id)

    async def async_turn_off(
        self, area_id: str, transition: float | None = None
    ) -> None:
        """Turn off the scene's lights, keeping baseline and factor."""
        if (area := self._areas.get(area_id)) is None:
            return
        calls = []
        for eid, tl in area.lights.items():
            state = self.hass.states.get(eid)
            if not tl.on or state is None or state.state != STATE_ON:
                continue
            data: dict[str, Any] = {ATTR_ENTITY_ID: eid}
            if transition is not None:
                data[ATTR_TRANSITION] = transition
            calls.append((SERVICE_TURN_OFF, data))
        await self._async_call(calls, transition)
        self._notify(area_id)

    async def _async_call(
        self, calls: list[tuple[str, dict[str, Any]]], transition: float | None
    ) -> None:
        if not calls:
            return
        context = Context()
        self._own_contexts.append(context.id)
        if transition:
            busy_until = time.monotonic() + transition + COMMAND_GRACE_SECONDS
            for _, data in calls:
                self._busy_until[data[ATTR_ENTITY_ID]] = busy_until
        await asyncio.gather(
            *(
                self.hass.services.async_call(
                    LIGHT_DOMAIN, service, data, blocking=True, context=context
                )
                for service, data in calls
            )
        )

    def _available(self, entity_id: str) -> bool:
        state = self.hass.states.get(entity_id)
        return state is not None and state.state not in _INVALID_STATES

    # --- event handling ----------------------------------------------------

    @callback
    def _async_on_state_change(self, event: Event[EventStateChangedData]) -> None:
        entity_id = event.data["entity_id"]
        if entity_id.startswith(f"{SCENE_DOMAIN}."):
            self._handle_scene_change(
                entity_id, event.data["old_state"], event.data["new_state"]
            )
        elif entity_id in self._light_areas:
            self._handle_light_change(entity_id, event.data["new_state"])

    @callback
    def _handle_scene_change(
        self, entity_id: str, old: State | None, new: State | None
    ) -> None:
        # A scene's state is its last activation time. Entity (re)adds on
        # startup or reload have old=None, removals have new=None: not activations.
        if old is None or new is None or old.state == STATE_UNAVAILABLE:
            return
        if new.state in _INVALID_STATES or new.state == old.state:
            return
        targets = async_scene_light_targets(self.hass, entity_id)
        if not targets:
            return
        area_id = self._resolve_area(entity_id, targets)
        if area_id is None:
            _LOGGER.debug("Scene %s has no area; not tracked", entity_id)
            return

        is_new_area = area_id not in self._areas
        self._areas[area_id] = AreaScene(
            scene_entity_id=entity_id, activated_at=new.state, lights=targets
        )
        # The scene's light changes carry the activation context.
        self._own_contexts.append(new.context.id)
        self._rebuild_light_index()
        self._schedule_save()
        self._notify(area_id)
        if is_new_area:
            self._notify_areas_changed()

    @callback
    def _handle_light_change(self, entity_id: str, new: State | None) -> None:
        area_ids = self._light_areas.get(entity_id, set())
        if new is None or new.state in _INVALID_STATES:
            for area_id in area_ids:
                self._notify(area_id)
            return
        manual = (
            new.context.id not in self._own_contexts
            and new.context.parent_id not in self._own_contexts
            and time.monotonic() >= self._busy_until.get(entity_id, 0)
        )
        changed = False
        for area_id in area_ids:
            if manual and self._apply_manual_change(
                self._areas[area_id], entity_id, new
            ):
                changed = True
            self._notify(area_id)
        if changed:
            self._schedule_save()

    @staticmethod
    def _apply_manual_change(area: AreaScene, entity_id: str, new: State) -> bool:
        """Fold a change made outside of us into the baseline. True if changed."""
        tl = area.lights[entity_id]
        if new.state == STATE_OFF:
            if not tl.on:
                return False
            tl.on = False
        elif new.state == STATE_ON:
            brightness = new.attributes.get(ATTR_BRIGHTNESS) or 255
            if (
                tl.on
                and abs(brightness - tl.target(area.factor)) <= BRIGHTNESS_TOLERANCE
            ):
                return False
            tl.baseline = max(1, min(255, round(brightness / area.factor)))
            tl.on = True
        else:
            return False
        area.modified = True
        return True

    @callback
    def _async_on_scene_reload(self, event: Event) -> None:
        platform = self.hass.data.get(HA_SCENE_PLATFORM_DATA)
        existing = set(platform.entities) if platform is not None else set()
        gone = [
            area_id
            for area_id, area in self._areas.items()
            if area.scene_entity_id not in existing
        ]
        for area_id in gone:
            _LOGGER.debug("Scene of area %s was removed; dropping tracking", area_id)
            del self._areas[area_id]
            self._notify(area_id)
        if gone:
            self._rebuild_light_index()
            self._schedule_save()
        self._notify_areas_changed()

    @callback
    def _async_on_registry_update(self, event: Event) -> None:
        entity_id = event.data.get("entity_id")
        if entity_id is None or entity_id.startswith(
            (f"{SCENE_DOMAIN}.", f"{LIGHT_DOMAIN}.")
        ):
            self._notify_areas_changed()

    # --- helpers -----------------------------------------------------------

    @callback
    def _resolve_area(
        self, scene_entity_id: str, targets: dict[str, TrackedLight]
    ) -> str | None:
        """The scene's own area, else the area most of its lights are in."""
        if area_id := self._entity_area(scene_entity_id):
            return area_id
        counts = Counter(
            area_id for eid in targets if (area_id := self._entity_area(eid))
        )
        return counts.most_common(1)[0][0] if counts else None

    @callback
    def _entity_area(self, entity_id: str) -> str | None:
        entry = er.async_get(self.hass).async_get(entity_id)
        if entry is None:
            return None
        if entry.area_id:
            return entry.area_id
        if entry.device_id and (
            device := dr.async_get(self.hass).async_get(entry.device_id)
        ):
            return device.area_id
        return None

    def _rebuild_light_index(self) -> None:
        index: dict[str, set[str]] = {}
        for area_id, area in self._areas.items():
            for eid in area.lights:
                index.setdefault(eid, set()).add(area_id)
        self._light_areas = index

    @callback
    def _schedule_save(self) -> None:
        self._store.async_delay_save(self._data_to_save, SAVE_DELAY)

    def _data_to_save(self) -> dict[str, Any]:
        return {
            "areas": {area_id: area.as_dict() for area_id, area in self._areas.items()}
        }
