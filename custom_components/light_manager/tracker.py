"""Track the last scene applied per area and dim it relatively."""

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
from homeassistant.components.scene import DATA_COMPONENT as SCENE_COMPONENT
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
from homeassistant.helpers.event import (
    TrackStates,
    async_call_later,
    async_track_state_change_filtered,
)
from homeassistant.helpers.start import async_at_started
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
from .hue import HueRecallWatcher, async_hue_scene_targets

_LOGGER = logging.getLogger(__name__)

SCENE_DOMAIN = "scene"
HA_SCENE_PLATFORM = "homeassistant"
_INVALID_STATES = (STATE_UNAVAILABLE, STATE_UNKNOWN)
# After re-applying a dimmed scene, wait this long for the Hue bridge to finish
# its recall before restoring the scene brightness (the bridge reported ~1.2 s).
RESTORE_DELAY_SECONDS = 2.0
# A Hue scene activated through HA is reported twice: first by the HA scene
# state change, then by the bridge's recall event. Skip the second.
_DUPLICATE_ACTIVATION_SECONDS = 5.0


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
    """Return the lights a scene sets, with their target brightness.

    Supports Home Assistant scenes and Hue scenes. Returns None for other
    scenes and for scene.create snapshots.
    """
    platform = hass.data.get(HA_SCENE_PLATFORM_DATA)
    if platform is not None and (entity := platform.entities.get(scene_entity_id)):
        return _ha_scene_targets(entity)
    component = hass.data.get(SCENE_COMPONENT)
    if component is None or (entity := component.get_entity(scene_entity_id)) is None:
        return None
    return async_hue_scene_targets(hass, entity, TrackedLight)


def _ha_scene_targets(entity: Any) -> dict[str, TrackedLight] | None:
    """Targets of a Home Assistant scene, from the platform's internal config.

    HA has no public API for a scene's target states.
    """
    if getattr(entity, "from_service", False):
        return None
    try:
        states: dict[str, State] = entity.scene_config.states
    except AttributeError:
        _LOGGER.warning(
            "Cannot read the config of %s: Home Assistant's scene internals changed",
            entity.entity_id,
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
        self._hue = HueRecallWatcher(self._on_hue_recall)
        # scene entity id -> monotonic time of its last activation through HA
        self._last_ha_activation: dict[str, float] = {}
        # area id -> cancel callback of a scheduled scene restore
        self._pending_restores: dict[str, CALLBACK_TYPE] = {}

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
        self._unsubs.append(async_at_started(self.hass, self._async_on_started))
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
        while self._pending_restores:
            self._pending_restores.popitem()[1]()
        self._hue.async_stop()

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
        for entity in self._scene_entities():
            targets = async_scene_light_targets(self.hass, entity.entity_id)
            if targets and (area := self._resolve_area(entity.entity_id, targets)):
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
        if old is None and new is not None:
            # A scene entity was added: it may be on a Hue bridge not yet watched.
            self._hue.async_refresh(self._scene_entities())
        # A scene's state is its last activation time. Entity (re)adds on
        # startup or reload have old=None, removals have new=None: not activations.
        if old is None or new is None or old.state == STATE_UNAVAILABLE:
            return
        if new.state in _INVALID_STATES or new.state == old.state:
            return
        self._last_ha_activation[entity_id] = time.monotonic()
        _LOGGER.debug("Scene %s activated through HA at %s", entity_id, new.state)
        self._activate(entity_id, new.state, new.context.id)

    @callback
    def _on_hue_recall(self, entity_id: str, recalled_at: str) -> None:
        """A Hue scene was recalled, possibly from the Hue app or a switch."""
        last = self._last_ha_activation.get(entity_id)
        if last is not None and time.monotonic() - last < _DUPLICATE_ACTIVATION_SECONDS:
            _LOGGER.debug("Hue recall of %s at %s: duplicate", entity_id, recalled_at)
            return
        _LOGGER.debug("Hue recall of %s at %s", entity_id, recalled_at)
        self._activate(entity_id, recalled_at)

    @callback
    def _activate(
        self, entity_id: str, activated_at: str, context_id: str | None = None
    ) -> None:
        targets = async_scene_light_targets(self.hass, entity_id)
        if not targets:
            return
        area_id = self._resolve_area(entity_id, targets)
        if area_id is None:
            _LOGGER.debug("Scene %s has no area; not tracked", entity_id)
            return

        # The scene's light changes carry the activation context. Only for
        # tracked scenes: lights changed by other scenes are manual changes.
        if context_id is not None:
            self._own_contexts.append(context_id)
        previous = self._areas.get(area_id)
        _LOGGER.debug(
            "Tracking %s for area %s; previous: %s",
            entity_id,
            area_id,
            previous
            and f"{previous.scene_entity_id} factor={previous.factor:.3f} "
            f"modified={previous.modified}",
        )
        self._areas[area_id] = AreaScene(
            scene_entity_id=entity_id, activated_at=activated_at, lights=targets
        )
        self._rebuild_light_index()
        self._schedule_save()
        self._notify(area_id)
        if previous is None:
            self._notify_areas_changed()
        elif previous.scene_entity_id == entity_id and (
            previous.factor < 1 or previous.modified
        ):
            # Re-applying a dimmed or changed Hue scene leaves the lights as
            # they are: the bridge re-applies the scene at the current dim
            # level. Once the bridge is done, restore the scene brightness.
            self._schedule_restore(area_id)

    @callback
    def _schedule_restore(self, area_id: str) -> None:
        _LOGGER.debug("Scheduling a scene restore for area %s", area_id)
        if cancel := self._pending_restores.pop(area_id, None):
            cancel()

        @callback
        def _restore(_now: Any) -> None:
            self._pending_restores.pop(area_id, None)
            self.hass.async_create_task(self.async_restore_scene(area_id))

        self._pending_restores[area_id] = async_call_later(
            self.hass, RESTORE_DELAY_SECONDS, _restore
        )

    async def async_restore_scene(self, area_id: str) -> None:
        """Set lights that are off their scene values back to them."""
        # Dimmed again meanwhile: leave it.
        if (area := self._areas.get(area_id)) is None or area.factor < 1:
            _LOGGER.debug("Scene restore for area %s skipped", area_id)
            return
        calls = []
        for eid, tl in area.lights.items():
            state = self.hass.states.get(eid)
            if state is None or state.state in _INVALID_STATES:
                continue
            if tl.on:
                brightness = state.attributes.get(ATTR_BRIGHTNESS)
                if (
                    state.state == STATE_ON
                    and brightness is not None
                    and abs(brightness - tl.baseline) <= BRIGHTNESS_TOLERANCE
                ):
                    continue
                calls.append(
                    (
                        SERVICE_TURN_ON,
                        {ATTR_ENTITY_ID: eid, ATTR_BRIGHTNESS: tl.baseline},
                    )
                )
            elif state.state == STATE_ON:
                calls.append((SERVICE_TURN_OFF, {ATTR_ENTITY_ID: eid}))
        _LOGGER.debug(
            "Scene restore for area %s: %s",
            area_id,
            {
                eid: (s.state, s.attributes.get(ATTR_BRIGHTNESS), tl.baseline)
                for eid, tl in area.lights.items()
                if (s := self.hass.states.get(eid)) is not None
            },
        )
        if calls:
            _LOGGER.info(
                "Scene %s applied again: restoring %d light(s) to the scene",
                area.scene_entity_id,
                len(calls),
            )
        await self._async_call(calls, None)
        self._notify(area_id)

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
        self._drop_missing_scenes()
        self._notify_areas_changed()

    @callback
    def _async_on_started(self, *_: Any) -> None:
        self._hue.async_refresh(self._scene_entities())
        # Stored scenes may have been deleted while we weren't running.
        self._drop_missing_scenes()
        self._notify_areas_changed()

    @callback
    def _drop_missing_scenes(self) -> None:
        """Stop tracking areas whose scene is gone.

        A scene reload re-adds HA scene entities with eager tasks, so they are
        loaded again when scene_reloaded fires (tests/test_dimming.py pins
        this). A Hue scene that isn't loaded may just have its bridge offline:
        it counts as gone only when its registry entry is gone too.
        """
        component = self.hass.data.get(SCENE_COMPONENT)
        ent_reg = er.async_get(self.hass)
        missing = set()
        for area in self._areas.values():
            entity_id = area.scene_entity_id
            if component is not None and component.get_entity(entity_id):
                continue
            entry = ent_reg.async_get(entity_id)
            if entry is None or entry.platform == HA_SCENE_PLATFORM:
                missing.add(entity_id)
        self._drop_areas_of(missing)

    @callback
    def _async_on_registry_update(self, event: Event) -> None:
        entity_id = event.data.get("entity_id")
        if entity_id is not None and entity_id.startswith(f"{SCENE_DOMAIN}."):
            # Deleting a UI scene removes its registry entry without a reload.
            if event.data["action"] == "remove":
                self._drop_areas_of({entity_id})
            elif old_entity_id := event.data.get("old_entity_id"):
                self._rename_scene(old_entity_id, entity_id)
        if entity_id is None or entity_id.startswith(
            (f"{SCENE_DOMAIN}.", f"{LIGHT_DOMAIN}.")
        ):
            self._notify_areas_changed()

    @callback
    def _drop_areas_of(self, scene_entity_ids: set[str]) -> None:
        """Stop tracking areas whose active scene no longer exists."""
        gone = [
            area_id
            for area_id, area in self._areas.items()
            if area.scene_entity_id in scene_entity_ids
        ]
        for area_id in gone:
            _LOGGER.debug("Scene of area %s was removed; dropping tracking", area_id)
            del self._areas[area_id]
            self._notify(area_id)
        if gone:
            self._rebuild_light_index()
            self._schedule_save()

    @callback
    def _rename_scene(self, old_entity_id: str, new_entity_id: str) -> None:
        for area_id, area in self._areas.items():
            if area.scene_entity_id == old_entity_id:
                area.scene_entity_id = new_entity_id
                self._schedule_save()
                self._notify(area_id)

    # --- helpers -----------------------------------------------------------

    def _scene_entities(self) -> list[Any]:
        component = self.hass.data.get(SCENE_COMPONENT)
        return list(component.entities) if component is not None else []

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
