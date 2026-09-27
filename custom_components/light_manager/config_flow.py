"""Config flow for Light Manager."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN


class LightManagerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Single-instance flow without options."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Confirm and create the entry."""
        if user_input is not None:
            return self.async_create_entry(title="Light Manager", data={})
        return self.async_show_form(step_id="user")
