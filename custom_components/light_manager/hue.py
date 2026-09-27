"""Hue scenes: per-light targets from the bridge resource, and recalls outside HA.

Duck-typed against the Hue integration's scene entities (`entity.resource`, an
aiohue v2 Scene, and `entity.controller`, its ScenesController) so aiohue
isn't imported here. tests/test_ha_internals.py pins the aiohue fields used.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import TYPE_CHECKING, Any

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.util import color as color_util

if TYPE_CHECKING:
    from .tracker import TrackedLight

_LOGGER = logging.getLogger(__name__)

_LIGHT = "light"
_EVENT_UPDATE = "update"  # aiohue EventType.RESOURCE_UPDATED


def _value(enum_or_str: Any) -> Any:
    return getattr(enum_or_str, "value", enum_or_str)


def _actions(entity: Any) -> list[Any] | None:
    """The scene's per-light actions, None if entity isn't a (non-smart) Hue scene."""
    actions = getattr(getattr(entity, "resource", None), "actions", None)
    return actions if isinstance(actions, list) else None


def is_hue_scene(entity: Any) -> bool:
    """Whether the scene entity is a Hue scene with per-light actions."""
    return _actions(entity) is not None


@callback
def async_hue_scene_targets(
    hass: HomeAssistant, entity: Any, tracked_light: type[TrackedLight]
) -> dict[str, TrackedLight] | None:
    """Lights a Hue scene sets, with their target brightness (0-255)."""
    if (actions := _actions(entity)) is None:
        return None
    ent_reg = er.async_get(hass)
    platform = entity.platform.platform_name
    targets: dict[str, TrackedLight] = {}
    try:
        for action in actions:
            if _value(action.target.rtype) != _LIGHT:
                continue
            entity_id = ent_reg.async_get_entity_id(_LIGHT, platform, action.target.rid)
            if entity_id is None:
                continue
            on_feature = action.action.on
            on = on_feature.on if on_feature is not None else True
            dimming = action.action.dimming
            # Without a dimming action the light keeps its brightness; the
            # first report then corrects the baseline as a manual change.
            baseline = round(dimming.brightness / 100 * 255) if dimming else 255
            targets[entity_id] = tracked_light(
                baseline=max(1, min(255, baseline)), on=on
            )
    except AttributeError:
        _LOGGER.warning(
            "Cannot read Hue scene %s: the Hue integration's scene model changed",
            entity.entity_id,
        )
        return None
    return targets


class HueRecallWatcher:
    """Reports Hue scene recalls, including those from the Hue app or switches.

    A recall made outside HA doesn't change the HA scene entity; the bridge
    does update the scene's status.last_recall.
    """

    def __init__(self, on_recall: Callable[[str, str], None]) -> None:
        """on_recall(scene_entity_id, recalled_at_iso)."""
        self._on_recall = on_recall
        self._unsubs: dict[int, CALLBACK_TYPE] = {}
        self._entity_ids: dict[str, str] = {}  # Hue resource id -> entity id
        self._last_recall: dict[str, Any] = {}  # Hue resource id -> datetime

    @callback
    def async_refresh(self, entities: list[Any]) -> None:
        """Subscribe to the bridges of these scene entities (idempotent)."""
        for entity in entities:
            if not is_hue_scene(entity) or entity.entity_id is None:
                continue
            resource = entity.resource
            self._entity_ids[resource.id] = entity.entity_id
            self._last_recall.setdefault(resource.id, self._recall_time(resource))
            controller = getattr(entity, "controller", None)
            if controller is None or id(controller) in self._unsubs:
                continue
            self._unsubs[id(controller)] = controller.subscribe(self._on_event)

    @callback
    def async_stop(self) -> None:
        """Unsubscribe from all bridges."""
        for unsub in self._unsubs.values():
            unsub()
        self._unsubs.clear()

    @staticmethod
    def _recall_time(resource: Any) -> Any:
        return getattr(getattr(resource, "status", None), "last_recall", None)

    @callback
    def _on_event(self, event_type: Any, resource: Any) -> None:
        if _value(event_type) != _EVENT_UPDATE:
            return
        resource_id = getattr(resource, "id", None)
        if (entity_id := self._entity_ids.get(resource_id)) is None:
            return
        recalled_at = self._recall_time(resource)
        if recalled_at is None or recalled_at == self._last_recall.get(resource_id):
            return
        self._last_recall[resource_id] = recalled_at
        self._on_recall(entity_id, recalled_at.isoformat())


def hue_scene_colors(entity: Any) -> list[tuple[int, int, int]]:
    """RGB colors of a Hue scene: its palette, else the lights' actions."""
    resource = getattr(entity, "resource", None)
    colors: list[tuple[int, int, int]] = []
    try:
        if (palette := getattr(resource, "palette", None)) and palette.color:
            colors = [_xy_rgb(item.color.xy) for item in palette.color]
        elif palette and palette.color_temperature:
            colors = [
                _mirek_rgb(item.color_temperature.mirek)
                for item in palette.color_temperature
            ]
        else:
            for action in _actions(entity) or []:
                if _value(action.target.rtype) != _LIGHT:
                    continue
                feature = action.action
                if feature.on is not None and not feature.on.on:
                    continue
                if feature.color is not None:
                    colors.append(_xy_rgb(feature.color.xy))
                elif feature.color_temperature is not None and (
                    feature.color_temperature.mirek
                ):
                    colors.append(_mirek_rgb(feature.color_temperature.mirek))
                else:
                    colors.append(WARM_WHITE)
    except AttributeError:
        return []
    return colors


# Pale warm white, as the Hue app shows white and warm-white lamps; color
# temperatures are mixed toward white the same way (the card does too).
WARM_WHITE = (252, 214, 140)
_WHITE_MIX = 0.3


def _xy_rgb(xy: Any) -> tuple[int, int, int]:
    return color_util.color_xy_to_RGB(xy.x, xy.y)


def _mirek_rgb(mirek: int) -> tuple[int, int, int]:
    return kelvin_rgb(1_000_000 / mirek)


def kelvin_rgb(kelvin: float) -> tuple[int, int, int]:
    """Color temperature as a pale RGB, like the Hue app shows it."""
    r, g, b = color_util.color_temperature_to_rgb(kelvin)
    return (
        round(r + (255 - r) * _WHITE_MIX),
        round(g + (255 - g) * _WHITE_MIX),
        round(b + (255 - b) * _WHITE_MIX),
    )
