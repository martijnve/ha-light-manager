"""Scene tracking and relative dimming."""

from __future__ import annotations

from unittest.mock import patch

from homeassistant.core import Context, HomeAssistant
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import SCENES, area_id

LIVING = "light.living_room_scene"
KITCHEN = "light.kitchen_scene"


async def activate(hass: HomeAssistant, scene: str) -> None:
    """Activate a scene the way a user would."""
    await hass.services.async_call(
        "scene", "turn_on", {"entity_id": scene}, blocking=True, context=Context()
    )
    await hass.async_block_till_done()


async def set_dimmer(hass: HomeAssistant, entity_id: str, **data) -> None:
    """Call light.turn_on on a dimmer."""
    await hass.services.async_call(
        "light", "turn_on", {"entity_id": entity_id, **data}, blocking=True
    )
    await hass.async_block_till_done()


def brightness(hass: HomeAssistant, entity_id: str) -> int | None:
    """Current brightness, None when off."""
    state = hass.states.get(entity_id)
    assert state is not None
    return state.attributes.get("brightness") if state.state == "on" else None


async def test_dimmers_created_unavailable(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """One dimmer per area with a HA scene, unavailable until a scene is applied."""
    assert hass.states.get(LIVING).state == "unavailable"
    assert hass.states.get(KITCHEN).state == "unavailable"


async def test_activation_builds_baseline(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """Activating a scene tracks it for the scene's area at 100 %."""
    await activate(hass, "scene.evening")

    state = hass.states.get(LIVING)
    assert state.state == "on"
    assert state.attributes["brightness"] == 255
    assert state.attributes["active_scene"] == "scene.evening"
    assert state.attributes["modified"] is False
    assert state.attributes["baseline"] == {
        "light.lamp_a": 200,
        "light.lamp_b": 100,
        "light.lamp_c": 0,
    }
    # Area from the lights: the Cooking scene has no registry entry.
    await activate(hass, "scene.cooking")
    assert hass.states.get(KITCHEN).attributes["active_scene"] == "scene.cooking"


async def test_dim_relative(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    """Dimming to 50 % halves every light; off lights stay off; minimum 1."""
    await activate(hass, "scene.evening")

    await set_dimmer(hass, LIVING, brightness_pct=50)
    assert brightness(hass, "light.lamp_a") == 100
    assert brightness(hass, "light.lamp_b") == 50
    assert brightness(hass, "light.lamp_c") is None
    assert hass.states.get(LIVING).attributes["brightness"] == 128

    await set_dimmer(hass, LIVING, brightness=1)
    assert brightness(hass, "light.lamp_a") == 1
    assert brightness(hass, "light.lamp_b") == 1

    # Our own commands are not manual changes.
    assert hass.states.get(LIVING).attributes["modified"] is False


async def test_brightness_step(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    """Dimmer-switch style brightness_step_pct works on the virtual light."""
    await activate(hass, "scene.evening")
    await set_dimmer(hass, LIVING, brightness_step_pct=-50)
    assert brightness(hass, "light.lamp_a") == 100


async def test_turn_off_and_on(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    """Off turns the scene lights off; on restores them at the current factor."""
    await activate(hass, "scene.evening")
    await set_dimmer(hass, LIVING, brightness_pct=50)

    await hass.services.async_call(
        "light", "turn_off", {"entity_id": LIVING}, blocking=True
    )
    await hass.async_block_till_done()
    assert hass.states.get(LIVING).state == "off"
    assert brightness(hass, "light.lamp_a") is None

    await set_dimmer(hass, LIVING)
    assert brightness(hass, "light.lamp_a") == 100
    assert brightness(hass, "light.lamp_b") == 50
    assert brightness(hass, "light.lamp_c") is None


async def test_manual_change_updates_baseline(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """A light changed by hand keeps dimming relative to its new value."""
    await activate(hass, "scene.evening")
    await set_dimmer(hass, LIVING, brightness_pct=50)

    # By hand: lamp_b to 80 at factor ~0.5 -> baseline ~160; lamp_c on at 60 -> 120.
    await hass.services.async_call(
        "light",
        "turn_on",
        {"entity_id": "light.lamp_b", "brightness": 80},
        blocking=True,
    )
    await hass.services.async_call(
        "light",
        "turn_on",
        {"entity_id": "light.lamp_c", "brightness": 60},
        blocking=True,
    )
    await hass.services.async_call(
        "light", "turn_off", {"entity_id": "light.lamp_a"}, blocking=True
    )
    await hass.async_block_till_done()

    state = hass.states.get(LIVING)
    assert state.attributes["modified"] is True
    assert state.attributes["baseline"] == {
        "light.lamp_a": 0,
        "light.lamp_b": 159,
        "light.lamp_c": 120,
    }

    await set_dimmer(hass, LIVING, brightness_pct=100)
    assert brightness(hass, "light.lamp_a") is None
    assert brightness(hass, "light.lamp_b") == 159
    assert brightness(hass, "light.lamp_c") == 120

    # Re-activating the scene resets the baseline.
    await activate(hass, "scene.evening")
    state = hass.states.get(LIVING)
    assert state.attributes["modified"] is False
    assert state.attributes["baseline"]["light.lamp_b"] == 100


async def test_area_from_scene_registry_entry(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """The scene entity's own area beats the lights' area."""
    er.async_get(hass).async_update_entity(
        "scene.evening", area_id=area_id(hass, "Kitchen")
    )
    await hass.async_block_till_done()
    await activate(hass, "scene.evening")
    assert hass.states.get(KITCHEN).attributes["active_scene"] == "scene.evening"
    assert hass.states.get(LIVING).state == "unavailable"


async def test_restored_after_reload(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """Tracking and factor survive an entry reload (store round-trip)."""
    await activate(hass, "scene.evening")
    await set_dimmer(hass, LIVING, brightness_pct=50)

    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()

    state = hass.states.get(LIVING)
    assert state.state == "on"
    assert state.attributes["brightness"] == 128
    assert state.attributes["active_scene"] == "scene.evening"
    await set_dimmer(hass, LIVING, brightness_pct=25)
    assert brightness(hass, "light.lamp_a") == 50


async def test_created_scene_ignored(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """scene.create snapshots don't hijack an area."""
    await activate(hass, "scene.evening")
    await hass.services.async_call(
        "scene",
        "create",
        {"scene_id": "snapshot", "snapshot_entities": ["light.lamp_a"]},
        blocking=True,
    )
    await activate(hass, "scene.snapshot")
    assert hass.states.get(LIVING).attributes["active_scene"] == "scene.evening"


async def test_scene_removed_on_reload(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """A tracked scene deleted from the config drops the area's tracking."""
    await activate(hass, "scene.evening")
    with patch(
        "homeassistant.config.load_yaml_config_file",
        return_value={"scene": [SCENES[1]]},
    ):
        await hass.services.async_call("scene", "reload", blocking=True)
        await hass.async_block_till_done()
    assert hass.states.get(LIVING).state == "unavailable"


async def test_reload_keeping_scene_keeps_tracking(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """Reloading scenes (e.g. after editing another scene) keeps tracking."""
    await activate(hass, "scene.evening")
    with patch(
        "homeassistant.config.load_yaml_config_file",
        return_value={"scene": SCENES},
    ):
        await hass.services.async_call("scene", "reload", blocking=True)
        await hass.async_block_till_done()
    assert hass.states.get(LIVING).attributes["active_scene"] == "scene.evening"


async def test_scene_deleted_from_registry(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """Deleting a UI scene removes its registry entry without a reload."""
    await activate(hass, "scene.evening")
    er.async_get(hass).async_remove("scene.evening")
    await hass.async_block_till_done()
    assert hass.states.get(LIVING).state == "unavailable"


async def test_scene_renamed(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    """An entity id rename of the tracked scene follows along."""
    await activate(hass, "scene.evening")
    er.async_get(hass).async_update_entity("scene.evening", new_entity_id="scene.night")
    await hass.async_block_till_done()
    assert hass.states.get(LIVING).attributes["active_scene"] == "scene.night"


async def test_stored_scene_missing_at_start(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """A stored scene deleted while the entry was unloaded is dropped on setup."""
    await activate(hass, "scene.evening")
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    with patch(
        "homeassistant.config.load_yaml_config_file",
        return_value={"scene": [SCENES[1]]},
    ):
        await hass.services.async_call("scene", "reload", blocking=True)
        await hass.async_block_till_done()

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(LIVING).state == "unavailable"


async def test_untracked_scene_counts_as_manual(
    hass: HomeAssistant, entry: MockConfigEntry
) -> None:
    """Lights changed by an untracked scene (a scene.create snapshot) update the baseline."""
    await activate(hass, "scene.evening")
    await hass.services.async_call(
        "scene",
        "create",
        {
            "scene_id": "flash",
            "entities": {"light.lamp_a": {"state": "on", "brightness": 50}},
        },
        blocking=True,
    )
    await activate(hass, "scene.flash")
    state = hass.states.get(LIVING)
    assert state.attributes["active_scene"] == "scene.evening"
    assert state.attributes["modified"] is True
    assert state.attributes["baseline"]["light.lamp_a"] == 50
