"""Light Manager: dim the active scene of an area relative to its scene brightness."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .tracker import SceneTracker

PLATFORMS: list[Platform] = [Platform.LIGHT]

type LightManagerConfigEntry = ConfigEntry[SceneTracker]


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
