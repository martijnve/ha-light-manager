"""Pin the Home Assistant internals Light Manager relies on.

A failure here after a Home Assistant upgrade means the scene platform changed
and tracker.async_scene_light_targets needs updating.
"""

from __future__ import annotations

from homeassistant.components.homeassistant import scene as ha_scene
from homeassistant.core import HomeAssistant

from custom_components.light_manager import const
from custom_components.light_manager.tracker import async_scene_light_targets


def test_constants_match() -> None:
    """Our copies of HA's internal names are still right."""
    assert const.HA_SCENE_PLATFORM_DATA == ha_scene.DATA_PLATFORM
    assert const.EVENT_SCENE_RELOADED == ha_scene.EVENT_SCENE_RELOADED
    assert "states" in ha_scene.SceneConfig._fields


async def test_reads_scene_config(hass: HomeAssistant, scenes: None) -> None:
    """Scene targets are readable from the platform."""
    targets = async_scene_light_targets(hass, "scene.evening")
    assert targets is not None
    assert {eid: (tl.baseline, tl.on) for eid, tl in targets.items()} == {
        "light.lamp_a": (200, True),
        "light.lamp_b": (100, True),
        "light.lamp_c": (255, False),
    }
    assert async_scene_light_targets(hass, "scene.missing") is None


def test_aiohue_fields() -> None:
    """The aiohue scene model still has the fields hue.py reads."""
    from dataclasses import fields

    from aiohue.v2.controllers.events import EventType
    from aiohue.v2.models.scene import Action, ActionAction, Scene, SceneStatus

    assert {"id", "actions", "status"} <= {f.name for f in fields(Scene)}
    assert {"target", "action"} <= {f.name for f in fields(Action)}
    assert {"on", "dimming"} <= {f.name for f in fields(ActionAction)}
    assert "last_recall" in {f.name for f in fields(SceneStatus)}
    assert EventType.RESOURCE_UPDATED.value == "update"
