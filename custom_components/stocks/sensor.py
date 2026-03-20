"""Sensor platform for HA Stocks integration."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

import asyncio

import aiohttp
import async_timeout

from homeassistant.components.sensor import SensorEntity, SensorDeviceClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_NAME, CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
    UpdateFailed,
)

from .const import (
    DOMAIN,
    CONF_SYMBOL,
    CONF_CURRENCY,
    DEFAULT_NAME,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_CURRENCY,
    YAHOO_FINANCE_API_URL,
    YAHOO_FINANCE_API_PARAMS,
    ATTR_CHANGE,
    ATTR_CHANGE_PERCENT,
    ATTR_PREVIOUS_CLOSE,
    ATTR_CURRENCY,
    ATTR_LONG_NAME,
    ATTR_HISTORICAL_DATA,
    ATTR_SYMBOL,
    ATTR_MARKET_STATE,
    ATTR_MARKET_TIME,
    ATTR_DAY_HIGH,
    ATTR_DAY_LOW,
    ATTR_VOLUME,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the stock sensor."""
    symbol = entry.data.get(CONF_SYMBOL, "").upper()
    name = entry.data.get(CONF_NAME, symbol)
    currency = entry.data.get(CONF_CURRENCY, DEFAULT_CURRENCY)
    scan_interval = entry.options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)

    coordinator = YahooFinanceDataUpdateCoordinator(
        hass, symbol, timedelta(seconds=scan_interval)
    )

    await coordinator.async_config_entry_first_refresh()

    async_add_entities(
        [StockSensor(coordinator, entry, symbol, name, currency)],
        update_before_add=True,
    )


class YahooFinanceDataUpdateCoordinator(DataUpdateCoordinator):
    """Class to manage fetching Yahoo Finance data."""

    def __init__(
        self,
        hass: HomeAssistant,
        symbol: str,
        update_interval: timedelta,
    ) -> None:
        """Initialize the coordinator."""
        self.symbol = symbol
        self.session = async_get_clientsession(hass)

        super().__init__(
            hass,
            _LOGGER,
            name=f"YahooFinance_{symbol}",
            update_interval=update_interval,
        )

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from Yahoo Finance API."""
        url = f"{YAHOO_FINANCE_API_URL}{self.symbol}{YAHOO_FINANCE_API_PARAMS}"

        try:
            async with async_timeout.timeout(10):
                async with self.session.get(url) as response:
                    if response.status != 200:
                        raise UpdateFailed(f"Error fetching data: {response.status}")

                    data = await response.json()

                    if "chart" not in data or "result" not in data["chart"] or not data["chart"]["result"]:
                        raise UpdateFailed("Invalid response from Yahoo Finance")

                    result = data["chart"]["result"][0]
                    meta = result["meta"]
                    indicators = result["indicators"]["quote"][0]

                    # Extract historical closing prices
                    closes = [c for c in indicators.get("close", []) if c is not None]

                    return {
                        ATTR_SYMBOL: self.symbol,
                        "price": meta.get("regularMarketPrice", 0),
                        ATTR_CHANGE: meta.get("regularMarketChange", 0),
                        ATTR_CHANGE_PERCENT: meta.get("regularMarketChangePercent", 0),
                        ATTR_PREVIOUS_CLOSE: meta.get("chartPreviousClose", 0),
                        ATTR_CURRENCY: meta.get("currency", DEFAULT_CURRENCY),
                        ATTR_LONG_NAME: meta.get("longName", self.symbol),
                        ATTR_HISTORICAL_DATA: closes,
                        ATTR_MARKET_STATE: meta.get("marketState", "CLOSED"),
                        ATTR_MARKET_TIME: meta.get("regularMarketTime"),
                        ATTR_DAY_HIGH: meta.get("regularMarketDayHigh", 0),
                        ATTR_DAY_LOW: meta.get("regularMarketDayLow", 0),
                        ATTR_VOLUME: meta.get("regularMarketVolume", 0),
                    }

        except aiohttp.ClientError as err:
            raise UpdateFailed(f"Error communicating with API: {err}") from err
        except asyncio.TimeoutError as err:
            raise UpdateFailed("Timeout fetching data") from err
        except Exception as err:
            raise UpdateFailed(f"Unexpected error: {err}") from err


class StockSensor(CoordinatorEntity, SensorEntity):
    """Representation of a Stock sensor."""

    _attr_has_entity_name = True
    _attr_native_value = None

    def __init__(
        self,
        coordinator: YahooFinanceDataUpdateCoordinator,
        config_entry: ConfigEntry,
        symbol: str,
        name: str,
        currency: str,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._config_entry = config_entry
        self._symbol = symbol
        self._attr_name = name
        self._attr_unique_id = f"{DOMAIN}_{symbol}"
        self._attr_icon = "mdi:chart-line"

        # Set device info
        self._attr_device_info = {
            "identifiers": {(DOMAIN, symbol)},
            "name": name,
            "manufacturer": "Yahoo Finance",
            "model": "Stock",
            "entry_type": "service",
        }

        # Store entities for service calls
        if "entities" not in self.hass.data[DOMAIN]:
            self.hass.data[DOMAIN]["entities"] = []
        self.hass.data[DOMAIN]["entities"].append(self)

    @property
    def native_value(self) -> float | None:
        """Return the state of the sensor."""
        if self.coordinator.data:
            return self.coordinator.data.get("price")
        return None

    @property
    def native_unit_of_measurement(self) -> str | None:
        """Return the unit of measurement."""
        if self.coordinator.data:
            return self.coordinator.data.get(ATTR_CURRENCY)
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the state attributes."""
        if not self.coordinator.data:
            return {}

        return {
            ATTR_CHANGE: self.coordinator.data.get(ATTR_CHANGE),
            ATTR_CHANGE_PERCENT: self.coordinator.data.get(ATTR_CHANGE_PERCENT),
            ATTR_PREVIOUS_CLOSE: self.coordinator.data.get(ATTR_PREVIOUS_CLOSE),
            ATTR_CURRENCY: self.coordinator.data.get(ATTR_CURRENCY),
            ATTR_LONG_NAME: self.coordinator.data.get(ATTR_LONG_NAME),
            ATTR_HISTORICAL_DATA: self.coordinator.data.get(ATTR_HISTORICAL_DATA, []),
            ATTR_SYMBOL: self.coordinator.data.get(ATTR_SYMBOL),
            ATTR_MARKET_STATE: self.coordinator.data.get(ATTR_MARKET_STATE),
            ATTR_MARKET_TIME: self.coordinator.data.get(ATTR_MARKET_TIME),
            ATTR_DAY_HIGH: self.coordinator.data.get(ATTR_DAY_HIGH),
            ATTR_DAY_LOW: self.coordinator.data.get(ATTR_DAY_LOW),
            ATTR_VOLUME: self.coordinator.data.get(ATTR_VOLUME),
        }

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return self.coordinator.last_update_success

    @property
    def state_class(self) -> str | None:
        """Return the state class of the sensor."""
        return "measurement"
