"""The HA Stocks integration."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    CONF_STOCKS,
    CONF_SYMBOL,
    CONF_NAME,
    DEFAULT_NAME,
    SERVICE_REFRESH,
    SERVICE_ADD_STOCK,
    SERVICE_REMOVE_STOCK,
    PLATFORMS,
)

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = vol.Schema(
    {
        DOMAIN: vol.Schema(
            {
                vol.Optional(CONF_STOCKS): vol.All(
                    cv.ensure_list,
                    [
                        vol.Schema(
                            {
                                vol.Required(CONF_SYMBOL): cv.string,
                                vol.Optional(CONF_NAME): cv.string,
                            }
                        )
                    ],
                )
            }
        )
    },
    extra=vol.ALLOW_EXTRA,
)

SERVICE_ADD_STOCK_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_SYMBOL): cv.string,
        vol.Optional(CONF_NAME): cv.string,
    }
)

SERVICE_REMOVE_STOCK_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_SYMBOL): cv.string,
    }
)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the HA Stocks component."""
    hass.data.setdefault(DOMAIN, {})

    # Store YAML config if present
    if DOMAIN in config:
        hass.data[DOMAIN]["yaml_config"] = config[DOMAIN]

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up HA Stocks from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    # Set up platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register services
    async def async_refresh_stocks(call: ServiceCall) -> None:
        """Service to manually refresh all stocks."""
        _LOGGER.debug("Manual refresh triggered via service")
        for entity in hass.data[DOMAIN].get("entities", []):
            await entity.async_update()

    async def async_add_stock(call: ServiceCall) -> None:
        """Service to add a new stock dynamically."""
        symbol = call.data[CONF_SYMBOL]
        name = call.data.get(CONF_NAME, DEFAULT_NAME)
        _LOGGER.info("Adding new stock: %s (%s)", symbol, name)

        # Reload the config entry to pick up the new stock
        await hass.config_entries.async_reload(entry.entry_id)

    async def async_remove_stock(call: ServiceCall) -> None:
        """Service to remove a stock."""
        symbol = call.data[CONF_SYMBOL]
        _LOGGER.info("Removing stock: %s", symbol)

    hass.services.async_register(
        DOMAIN, SERVICE_REFRESH, async_refresh_stocks
    )
    hass.services.async_register(
        DOMAIN, SERVICE_ADD_STOCK, async_add_stock, schema=SERVICE_ADD_STOCK_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE_STOCK, async_remove_stock, schema=SERVICE_REMOVE_STOCK_SCHEMA
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)

    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
