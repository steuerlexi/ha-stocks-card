"""Config flow for HA Stocks integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_NAME, CONF_SCAN_INTERVAL
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
import homeassistant.helpers.config_validation as cv

from .const import (
    DOMAIN,
    CONF_STOCKS,
    CONF_SYMBOL,
    CONF_CURRENCY,
    DEFAULT_NAME,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_CURRENCY,
)

_LOGGER = logging.getLogger(__name__)


class StocksConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for HA Stocks."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        errors = {}

        if user_input is not None:
            # Validate the symbol by attempting to fetch data
            symbol = user_input[CONF_SYMBOL].upper().strip()

            # Check if already configured
            await self.async_set_unique_id(symbol)
            self._abort_if_unique_id_configured()

            return self.async_create_entry(
                title=user_input.get(CONF_NAME, symbol),
                data=user_input,
            )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_SYMBOL): str,
                    vol.Optional(CONF_NAME): str,
                    vol.Optional(CONF_CURRENCY, default=DEFAULT_CURRENCY): str,
                }
            ),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> StocksOptionsFlowHandler:
        """Get the options flow for this handler."""
        return StocksOptionsFlowHandler(config_entry)


class StocksOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle options flow for HA Stocks."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        CONF_SCAN_INTERVAL,
                        default=self.config_entry.options.get(
                            CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL
                        ),
                    ): vol.All(vol.Coerce(int), vol.Range(min=60, max=3600)),
                }
            ),
        )
