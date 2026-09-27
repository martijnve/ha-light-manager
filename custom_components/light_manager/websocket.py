"""Websocket API for the Light Manager card."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN


@callback
def async_register(hass: HomeAssistant) -> None:
    """Register the websocket commands."""
    websocket_api.async_register_command(hass, ws_room)


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/room", vol.Required("area_id"): str}
)
@callback
def ws_room(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """A room's dimmer, scenes (with their colors) and lights."""
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        connection.send_error(msg["id"], "not_loaded", "Light Manager is not loaded")
        return
    room = entries[0].runtime_data.async_room(msg["area_id"])
    if room is None:
        connection.send_error(msg["id"], "not_found", "Unknown area")
        return
    connection.send_result(msg["id"], room)
