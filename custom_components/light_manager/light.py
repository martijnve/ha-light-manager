"""Per-area light whose brightness is the level of the area's active scene.

The level is the brightest scene light's brightness x the dim factor, so the
scene as a whole can be brightened until that light is at 100 %.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ATTR_TRANSITION,
    ColorMode,
    LightEntity,
    LightEntityFeature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.start import async_at_started

from . import LightManagerConfigEntry
from .const import (
    ATTR_ACTIVE_SCENE,
    ATTR_BASELINE,
    ATTR_MODIFIED,
    ATTR_SCENE_ACTIVATED_AT,
    DOMAIN,
)
from .tracker import SceneTracker


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LightManagerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add one scene dimmer per area that has a HA scene."""
    tracker = entry.runtime_data
    added: set[str] = set()

    @callback
    def _sync_areas(*_: Any) -> None:
        areas = tracker.async_scene_areas()
        new = areas - added
        if new:
            added.update(new)
            async_add_entities(
                AreaSceneLight(tracker, area_id) for area_id in sorted(new)
            )
        # Drop dimmers of deleted areas.
        area_reg = ar.async_get(hass)
        ent_reg = er.async_get(hass)
        for area_id in [a for a in added if area_reg.async_get_area(a) is None]:
            added.discard(area_id)
            if entity_id := ent_reg.async_get_entity_id("light", DOMAIN, area_id):
                ent_reg.async_remove(entity_id)

    _sync_areas()
    entry.async_on_unload(tracker.async_add_areas_changed_listener(_sync_areas))
    # Scenes may load after us on startup.
    entry.async_on_unload(async_at_started(hass, _sync_areas))


class AreaSceneLight(LightEntity):
    """Brightness = level of the area's active scene (brightest light x factor)."""

    _attr_should_poll = False
    _attr_color_mode = ColorMode.BRIGHTNESS
    _attr_supported_color_modes = {ColorMode.BRIGHTNESS}
    _attr_supported_features = LightEntityFeature.TRANSITION
    _attr_icon = "mdi:lightbulb-group"

    def __init__(self, tracker: SceneTracker, area_id: str) -> None:
        """Initialise."""
        self._tracker = tracker
        self._area_id = area_id
        self._attr_unique_id = area_id

    async def async_added_to_hass(self) -> None:
        """Follow the tracker."""
        self.async_on_remove(
            self._tracker.async_add_area_listener(
                self._area_id, self.async_write_ha_state
            )
        )

    @property
    def name(self) -> str:
        """Area name + ' scene'."""
        area = ar.async_get(self.hass).async_get_area(self._area_id)
        return f"{area.name if area else self._area_id} scene"

    @property
    def available(self) -> bool:
        """Unavailable until a scene was applied to the area."""
        return self._tracker.get(self._area_id) is not None

    @property
    def is_on(self) -> bool:
        """On when any light of the scene is on."""
        return self._tracker.is_on(self._area_id)

    @property
    def brightness(self) -> int | None:
        """The scene level as 0-255."""
        if (area := self._tracker.get(self._area_id)) is None:
            return None
        return max(1, min(255, round(area.factor * area.peak)))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Active scene and its per-light baseline."""
        if (area := self._tracker.get(self._area_id)) is None:
            return {}
        return {
            ATTR_ACTIVE_SCENE: area.scene_entity_id,
            ATTR_SCENE_ACTIVATED_AT: area.activated_at,
            ATTR_MODIFIED: area.modified,
            ATTR_BASELINE: {
                eid: tl.baseline if tl.on else 0 for eid, tl in area.lights.items()
            },
        }

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Dim the scene to the requested brightness, or turn it back on."""
        brightness = kwargs.get(ATTR_BRIGHTNESS)
        area = self._tracker.get(self._area_id)
        await self._tracker.async_turn_on(
            self._area_id,
            factor=brightness / area.peak if brightness is not None and area else None,
            transition=kwargs.get(ATTR_TRANSITION),
        )

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn off the scene's lights."""
        await self._tracker.async_turn_off(
            self._area_id, transition=kwargs.get(ATTR_TRANSITION)
        )
