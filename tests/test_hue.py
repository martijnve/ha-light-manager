"""Hue scenes: targets from the bridge's scene resource, recalls outside HA."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from aiohue.v2.controllers.events import EventType
from aiohue.v2.models.feature import DimmingFeatureBase, OnFeature
from aiohue.v2.models.resource import ResourceIdentifier, ResourceTypes
from aiohue.v2.models.scene import (
    Action,
    ActionAction,
    SceneActiveStatus,
    SceneMetadata,
    SceneStatus,
)
from aiohue.v2.models.scene import (
    Scene as HueScene,
)
from homeassistant.components.scene import Scene
from homeassistant.core import Context, HomeAssistant
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    MockEntityPlatform,
    async_fire_time_changed,
)

from custom_components.light_manager.const import DOMAIN

from .conftest import SCENES, MockLight

LIVING = "light.living_room_scene"
HUE_SCENE = "scene.hue_relax"
T0 = datetime(2026, 9, 27, 18, 0, tzinfo=UTC)


class FakeScenesController:
    """Stands in for aiohue's ScenesController."""

    def __init__(self) -> None:
        """Initialise."""
        self.callbacks: list[Any] = []

    def subscribe(self, callback: Any, id_filter: Any = None, event_filter: Any = None):
        """Register a callback like aiohue does."""
        self.callbacks.append(callback)
        return lambda: self.callbacks.remove(callback)

    def emit(self, resource: HueScene) -> None:
        """Send a resource update to subscribers."""
        for callback in list(self.callbacks):
            callback(EventType.RESOURCE_UPDATED, resource)


class MockHueScene(Scene):
    """Mimics the Hue integration's scene entity (resource + controller)."""

    _attr_should_poll = False

    def __init__(self, resource: HueScene, controller: FakeScenesController) -> None:
        """Initialise."""
        self.resource = resource
        self.controller = controller
        self._attr_unique_id = resource.id
        self._attr_name = resource.metadata.name

    async def async_activate(self, **kwargs: Any) -> None:
        """The bridge would set the lights."""


def hue_scene(last_recall: datetime | None = T0) -> HueScene:
    """Relax: lamp_a at 80 %, lamp_b off. Light rids are the lights' unique ids."""

    def light(rid: str) -> ResourceIdentifier:
        return ResourceIdentifier(rid=rid, rtype=ResourceTypes.LIGHT)

    return HueScene(
        id="scene-relax",
        metadata=SceneMetadata(name="Hue relax"),
        group=ResourceIdentifier(rid="room-1", rtype=ResourceTypes.ROOM),
        actions=[
            Action(
                target=light("lamp_a"),
                action=ActionAction(
                    on=OnFeature(on=True), dimming=DimmingFeatureBase(brightness=80.0)
                ),
            ),
            Action(target=light("lamp_b"), action=ActionAction(on=OnFeature(on=False))),
            Action(target=light("unknown"), action=ActionAction(on=OnFeature(on=True))),
        ],
        speed=0.5,
        status=SceneStatus(active=SceneActiveStatus.STATIC, last_recall=last_recall),
    )


@pytest.fixture
async def controller(
    hass: HomeAssistant, lights: dict[str, MockLight]
) -> FakeScenesController:
    """HA scenes plus one Hue scene, and Light Manager set up."""
    assert await async_setup_component(hass, "scene", {"scene": SCENES})
    # The scene component only takes YAML platforms from homeassistant.components;
    # entities of every scene platform share the component's entity dict.
    controller = FakeScenesController()
    platform = MockEntityPlatform(hass, domain="scene", platform_name="test")
    await platform.async_add_entities([MockHueScene(hue_scene(), controller)])
    await hass.async_block_till_done()
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return controller


async def dim(hass: HomeAssistant, brightness: int) -> None:
    """Dim the living room scene (its level is 204 at 100 %)."""
    await hass.services.async_call(
        "light", "turn_on", {"entity_id": LIVING, "brightness": brightness}, blocking=True
    )
    await hass.async_block_till_done()


async def test_activated_through_ha(
    hass: HomeAssistant, controller: FakeScenesController
) -> None:
    """Activating a Hue scene in HA tracks its bridge targets."""
    await hass.services.async_call(
        "scene", "turn_on", {"entity_id": HUE_SCENE}, blocking=True, context=Context()
    )
    await hass.async_block_till_done()

    state = hass.states.get(LIVING)
    assert state.attributes["active_scene"] == HUE_SCENE
    assert state.attributes["baseline"] == {"light.lamp_a": 204, "light.lamp_b": 0}

    await dim(hass, 102)
    assert hass.states.get("light.lamp_a").attributes["brightness"] == 102

    # The bridge then reports the same recall: not a second activation.
    controller.emit(hue_scene(T0 + timedelta(seconds=1)))
    await hass.async_block_till_done()
    assert hass.states.get(LIVING).attributes["brightness"] == 102


async def test_recalled_outside_ha(
    hass: HomeAssistant, controller: FakeScenesController
) -> None:
    """A recall from the Hue app or a switch is picked up from the bridge."""
    assert hass.states.get(LIVING).state == "unavailable"

    controller.emit(hue_scene(T0 + timedelta(minutes=1)))
    await hass.async_block_till_done()
    state = hass.states.get(LIVING)
    assert state.attributes["active_scene"] == HUE_SCENE
    assert state.attributes["scene_activated_at"] == "2026-09-27T18:01:00+00:00"

    # Other updates of the scene (same last_recall) don't re-activate it.
    await dim(hass, 102)
    controller.emit(hue_scene(T0 + timedelta(minutes=1)))
    await hass.async_block_till_done()
    assert hass.states.get(LIVING).attributes["brightness"] == 102


async def test_reapply_dimmed_scene_left_to_the_bridge(
    hass: HomeAssistant, controller: FakeScenesController
) -> None:
    """Re-applying the active scene after dimming sends no commands of our own.

    The bridge sets the scene values itself (the fake scene's activation does
    nothing, so the lamps stay where the dim left them).
    """

    async def activate() -> None:
        await hass.services.async_call(
            "scene",
            "turn_on",
            {"entity_id": HUE_SCENE},
            blocking=True,
            context=Context(),
        )
        await hass.async_block_till_done()

    await activate()
    await dim(hass, 102)
    await activate()
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=5))
    await hass.async_block_till_done()
    assert hass.states.get("light.lamp_a").attributes["brightness"] == 102
    assert hass.states.get(LIVING).attributes["modified"] is False


async def test_recall_at_lowest_level(
    hass: HomeAssistant, controller: FakeScenesController, lights: dict[str, MockLight]
) -> None:
    """A lamp at Hue's lowest level reports brightness 0: that is 1, not 255.

    Nightlight scenes have dimming 0.0 %; reading the lamps' reports as 255
    marked the scene modified and made a later recall restore it to 255.
    """
    from homeassistant.components.scene import DATA_COMPONENT

    entity = hass.data[DATA_COMPONENT].get_entity(HUE_SCENE)
    entity.resource.actions[0].action.dimming = DimmingFeatureBase(brightness=0.0)
    controller.emit(hue_scene(T0 + timedelta(minutes=1)))
    await hass.async_block_till_done()

    # The bridge turns the lamp on at its lowest level.
    lamp = lights["lamp_a"]
    lamp._attr_is_on = True
    lamp._attr_brightness = 0
    lamp.async_write_ha_state()
    await hass.async_block_till_done()

    state = hass.states.get(LIVING)
    assert state.attributes["baseline"]["light.lamp_a"] == 1
    assert state.attributes["modified"] is False


def test_scene_colors() -> None:
    """Scene colors come from the actions: xy color, color temperature, else warm white."""
    from aiohue.v2.models.feature import (
        ColorFeatureBase,
        ColorPoint,
        ColorTemperatureFeatureBase,
    )

    from custom_components.light_manager.hue import hue_scene_colors

    scene = hue_scene()
    scene.actions[0].action.color = ColorFeatureBase(xy=ColorPoint(x=0.675, y=0.322))
    scene.actions[2].action.color_temperature = ColorTemperatureFeatureBase(mirek=500)
    colors = hue_scene_colors(MockHueScene(scene, FakeScenesController()))
    # lamp_b is off in the scene and left out.
    assert len(colors) == 2
    red, warm = colors
    assert red[0] == 255 and red[1] < 100 and red[2] < 100
    assert warm[0] == 255 and warm[2] < warm[1] < warm[0]


async def test_scene_light_colors(
    hass: HomeAssistant, controller: FakeScenesController
) -> None:
    """Per light, the color the Hue scene sets (unknown lights left out)."""
    from homeassistant.components.scene import DATA_COMPONENT

    from custom_components.light_manager.hue import (
        WARM_WHITE,
        async_hue_scene_light_colors,
    )

    entity = hass.data[DATA_COMPONENT].get_entity(HUE_SCENE)
    assert async_hue_scene_light_colors(hass, entity) == {
        "light.lamp_a": WARM_WHITE,
        "light.lamp_b": WARM_WHITE,
    }
