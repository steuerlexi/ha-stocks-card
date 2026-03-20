"""Constants for the HA Stocks integration."""

DOMAIN = "stocks"

# Configuration keys
CONF_STOCKS = "stocks"
CONF_SYMBOL = "symbol"
CONF_NAME = "name"
CONF_SCAN_INTERVAL = "scan_interval"
CONF_CURRENCY = "currency"

# Default values
DEFAULT_NAME = "Stock"
DEFAULT_SCAN_INTERVAL = 300  # 5 minutes
DEFAULT_CURRENCY = "EUR"

# API Configuration
YAHOO_FINANCE_API_URL = "https://query1.finance.yahoo.com/v8/finance/chart/"
YAHOO_FINANCE_API_PARAMS = "?interval=1d&range=5d"

# Attribute names
ATTR_CHANGE = "change"
ATTR_CHANGE_PERCENT = "change_percent"
ATTR_PREVIOUS_CLOSE = "previous_close"
ATTR_CURRENCY = "currency"
ATTR_LONG_NAME = "long_name"
ATTR_HISTORICAL_DATA = "historical_data"
ATTR_SYMBOL = "symbol"
ATTR_MARKET_STATE = "market_state"
ATTR_MARKET_TIME = "market_time"
ATTR_DAY_HIGH = "day_high"
ATTR_DAY_LOW = "day_low"
ATTR_VOLUME = "volume"

# Service names
SERVICE_REFRESH = "refresh"
SERVICE_ADD_STOCK = "add_stock"
SERVICE_REMOVE_STOCK = "remove_stock"

# Platform
PLATFORMS = ["sensor"]
