# HA Stocks

A professional stock tracking integration for Home Assistant with a beautiful Lovelace card.

## Features

- **Real-time stock data** from Yahoo Finance
- **Auto-discovery** and config flow UI setup
- **Beautiful sparkline charts** showing 5-day trends
- **Multiple stocks support** with individual configuration
- **Market status indication** (open/closed)
- **Responsive design** that works on mobile and desktop
- **German and English** translations included
- **Services** for programmatic control (add/remove/refresh stocks)

## Installation

### HACS

1. Go to HACS → Integrations
2. Click the "+" button
3. Search for "HA Stocks" or add custom repository
4. Download and restart Home Assistant

### Manual

Copy the `custom_components/stocks/` folder to your Home Assistant `custom_components/` directory.

## Configuration

After installation:

1. Go to Settings → Devices & Services → Add Integration
2. Search for "HA Stocks"
3. Enter your stock symbol (e.g., `SAP.DE`, `AAPL`)
4. The integration will automatically create sensors and the Lovelace card

## Card Configuration

Add the card to your dashboard:

```yaml
type: custom:stocks-card
title: My Portfolio
stocks:
  - entity: sensor.sap_de
    name: SAP SE
  - entity: sensor.apple
    name: Apple Inc.
show_sparkline: true
show_currency: true
show_change: true
show_volume: true
refresh_interval: 300
```

## Services

- `stocks.refresh` - Refresh all stocks manually
- `stocks.add_stock` - Add a stock dynamically
- `stocks.remove_stock` - Remove a stock

## Support

For issues and feature requests, visit: https://github.com/steuerlexi/ha-stocks-card/issues
