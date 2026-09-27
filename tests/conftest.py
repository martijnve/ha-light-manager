"""Fixtures: mock lights in areas, HA scenes, and a set-up Light Manager."""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.components.light import ATTR_BRIGHTNESS, ColorMode, LightEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    setup_test_component_platform,
)

from custom_components.light_manager.const import DOMAIN


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Load custom_components/ in every test."""


class MockLight(LightEntity):
    """Dimmable light that remembers the last brightness."""

    _attr_should_poll = False
    _attr_color_mode = ColorMode.BRIGHTNESS
    _attr_supported_color_modes = {ColorMode.BRIGHTNESS}

    def __init__(self, unique_id: str) -> None:
        """Initialise off at full brightness."""
        self._attr_unique_id = unique_id
        self._attr_name = unique_id
        self._attr_is_on = False
        self._attr_brightness = 255

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn on."""
        self._attr_is_on = True
        if ATTR_BRIGHTNESS in kwargs:
            self._attr_brightness = kwargs[ATTR_BRIGHTNESS]
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn off."""
        self._attr_is_on = False
        self.async_write_ha_state()


LIGHTS = ("lamp_a", "lamp_b", "lamp_c", "lamp_d")


@pytest.fixture
async def lights(hass: HomeAssistant) -> dict[str, MockLight]:
    """light.lamp_a..c in the living room, light.lamp_d in the kitchen."""
    entities = {name: MockLight(name) for name in LIGHTS}
    setup_test_component_platform(hass, "light", list(entities.values()))
    assert await async_setup_component(hass, "light", {"light": {"platform": "test"}})
    await hass.async_block_till_done()

    area_reg = ar.async_get(hass)
    ent_reg = er.async_get(hass)
    living = area_reg.async_create("Living room")
    kitchen = area_reg.async_create("Kitchen")
    for name in ("lamp_a", "lamp_b", "lamp_c"):
        ent_reg.async_update_entity(f"light.{name}", area_id=living.id)
    ent_reg.async_update_entity("light.lamp_d", area_id=kitchen.id)
    return entities


SCENES = [
    {
        "id": "evening",
        "name": "Evening",
        "entities": {
            "light.lamp_a": {"state": "on", "brightness": 200},
            "light.lamp_b": {"state": "on", "brightness": 100},
            "light.lamp_c": {"state": "off"},
        },
    },
    {
        # No id: no registry entry, area comes from the lights.
        "name": "Cooking",
        "entities": {"light.lamp_d": {"state": "on", "brightness": 150}},
    },
]


@pytest.fixture
async def scenes(hass: HomeAssistant, lights: dict[str, MockLight]) -> None:
    """HA scenes from YAML."""
    assert await async_setup_component(hass, "scene", {"scene": SCENES})
    await hass.async_block_till_done()


@pytest.fixture
async def entry(hass: HomeAssistant, scenes: None) -> MockConfigEntry:
    """Set up Light Manager."""
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def area_id(hass: HomeAssistant, name: str) -> str:
    """Area id by name."""
    area = ar.async_get(hass).async_get_area_by_name(name)
    assert area is not None
    return area.id
