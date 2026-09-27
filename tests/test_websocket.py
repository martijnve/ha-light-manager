"""Websocket API used by the card."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import area_id


async def test_room(
    hass: HomeAssistant, entry: MockConfigEntry, hass_ws_client
) -> None:
    """The room query lists the dimmer, the room's scenes with colors, and its lights."""
    client = await hass_ws_client(hass)
    await client.send_json(
        {"id": 1, "type": "light_manager/room", "area_id": area_id(hass, "Living room")}
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    room = msg["result"]
    assert room["name"] == "Living room"
    assert room["dimmer"] == "light.living_room_scene"
    assert room["lights"] == ["light.lamp_a", "light.lamp_b", "light.lamp_c"]
    scenes = {scene["entity_id"]: scene for scene in room["scenes"]}
    assert set(scenes) == {"scene.bright", "scene.evening"}
    # No colors in the YAML scenes: the lights that are on count as warm white.
    assert scenes["scene.evening"]["colors"] == [[252, 214, 140], [252, 214, 140]]
    # Per light: what the scene sets, for the card's optimistic display.
    assert scenes["scene.evening"]["lights"] == {
        "light.lamp_a": {"on": True, "brightness": 200, "rgb": [252, 214, 140]},
        "light.lamp_b": {"on": True, "brightness": 100, "rgb": [252, 214, 140]},
        "light.lamp_c": {"on": False, "brightness": 255, "rgb": [252, 214, 140]},
    }

    await client.send_json({"id": 2, "type": "light_manager/room", "area_id": "nope"})
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "not_found"
