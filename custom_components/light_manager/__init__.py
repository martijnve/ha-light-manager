"""Light Manager: dim the active scene of an area relative to its scene brightness."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from . import websocket
from .const import CARD_URL, DOMAIN
from .tracker import SceneTracker

PLATFORMS: list[Platform] = [Platform.LIGHT]
CARD_FILE = Path(__file__).parent / "frontend" / "light-manager-card.js"

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type LightManagerConfigEntry = ConfigEntry[SceneTracker]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the websocket API and serve the dashboard card."""
    websocket.async_register(hass)
    # Without the frontend (e.g. in tests) there is no dashboard to serve.
    if (
        hass.http is not None
        and "frontend" in hass.config.components
        and (CARD_FILE.exists())
    ):
        integration = await async_get_integration(hass, DOMAIN)
        await hass.http.async_register_static_paths(
            [StaticPathConfig(CARD_URL, str(CARD_FILE), cache_headers=False)]
        )
        # The version query makes browsers load a new card after an update.
        add_extra_js_url(hass, f"{CARD_URL}?v={integration.version}")
    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: LightManagerConfigEntry
) -> bool:
    """Set up Light Manager from a config entry."""
    tracker = SceneTracker(hass)
    await tracker.async_load()
    tracker.async_start()
    entry.runtime_data = tracker
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: LightManagerConfigEntry
) -> bool:
    """Unload a config entry."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        entry.runtime_data.async_stop()
        await entry.runtime_data.async_save_now()
    return unloaded
