# Home Assistant Stock Card

A custom Lovelace card for displaying stock prices with sparklines, configured via REST sensors that pull data from Yahoo Finance.

## Features
- Displays stock name, current price, currency, daily change (absolute and %)
- Mini sparkline chart showing last 5 days of closing prices
- Configurable refresh interval
- Multiple stocks support
- Modern, clean design

## Installation

### 1. Set up REST Sensors
Copy the contents of `rest_sensors.yaml.example` into your `configuration.yaml` (or `sensors.yaml` if you use separate sensor files).

**Important:** You need to configure the stocks you want to monitor. The example includes:
- SAP.DE (SAP SE)
- VOW3.DE (Volkswagen VZ)
- IWDA.AS (iShares MSCI World)

To add more stocks, duplicate one of the REST sensor blocks and change:
- The `resource` URL (replace the symbol in the URL)
- The `name` of the sensor (e.g., "SYMBOL Chart")

The sensor will update every 5 minutes (configurable via `scan_interval`).

### 2. Install the Lovelace Card
1. Copy `stock-card.js` to your Home Assistant configuration directory, inside the `www` folder:
   ```
   <config>/www/stock-card.js
   ```
   If the `www` folder doesn't exist, create it.

2. If you don't already have it, install the [card-tools](https://github.com/thomasloven/lovelace-card-tools) plugin via HACS (recommended) or manually. This card depends on LitElement provided by card-tools.

### 3. Add the Card to Lovelace
In the Lovelace UI, add a custom card with the following configuration:

```yaml
type: custom:stock-card
title: Mein Portfolio
stocks:
  - entity: sensor.sap_de_chart
    name: SAP SE
  - entity: sensor.vow3_de_chart
    name: Volkswagen VZ
  - entity: sensor.iwda_as_chart
    name: iShares MSCI World
refresh_interval: 300  # Optional, defaults to 300 seconds (5 minutes)
show_sparkline: true   # Optional, defaults to true
show_currency: true    # Optional, defaults to true
```

**Configuration options:**
- `title`: Card title (optional, defaults to "Mein Portfolio")
- `stocks`: Array of stock objects, each requiring:
  - `entity`: The entity ID of the REST sensor (e.g., `sensor.sap_de_chart`)
  - `name`: Display name for the stock (optional; if omitted, uses the `longName` attribute from the sensor)
- `refresh_interval`: Update interval in seconds (optional, defaults to 300)
- `show_sparkline`: Whether to show the sparkline chart (optional, defaults to true)
- `show_currency`: Whether to show the currency symbol (optional, defaults to true)

## How It Works
The card reads data from REST sensors that you configure in `configuration.yaml`. Each sensor:
1. Queries Yahoo Finance API for stock data (1-day interval, 5-day range)
2. Sets the current price as the sensor's state
3. Sets additional attributes: change, change percent, previous close, currency, long name, and historical closing prices (for sparkline)
4. Updates every 5 minutes (by default)

The card then displays this data in a clean, responsive layout.

## Notes
- Yahoo Finance data is delayed by approximately 15 minutes.
- The sparkline shows the last 5 trading days of closing prices.
- If you encounter issues, check the Home Assistant logs for errors related to the REST sensors or the card.

## Customization
To modify the appearance, you can edit the CSS in the `<style>` section of `stock-card.js`.

## Troubleshooting
- **Entity not found**: Verify the REST sensor was created correctly and the entity ID matches.
- **No data displayed**: Check if the REST sensor is fetching data (look at its state in Developer Tools -> States).
- **Sparkline not showing**: Ensure historical data is being stored as an attribute (check the sensor's attributes).

## Data Sources
- Stock data: [Yahoo Finance API](https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?interval=1d&range=5d)
- Note: This is an undocumented API; use at your own risk for personal use only.

Enjoy tracking your stocks in Home Assistant!