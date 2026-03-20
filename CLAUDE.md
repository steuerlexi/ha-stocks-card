# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HA Stocks is a complete Home Assistant custom integration for tracking stock prices, distributed via HACS. It consists of:

1. **Backend Integration** (`custom_components/stocks/`): A Config Flow-based integration that fetches data from Yahoo Finance
2. **Frontend Card** (`custom_components/stocks/lovelace/`): A modern Lovelace card with sparkline charts

## Architecture

### Backend (`custom_components/stocks/`)

**Data Flow:**
```
Yahoo Finance API → sensor.py (YahooFinanceDataUpdateCoordinator) → Home Assistant State → Frontend Card
```

**Key Components:**
- `__init__.py`: Integration setup, service registration (refresh, add_stock, remove_stock)
- `config_flow.py`: Config Flow UI for adding stocks via HA UI
- `sensor.py`: Coordinator pattern for API polling, sensor entities
- `const.py`: Constants, attribute names, defaults
- `services.yaml`: Service definitions for manual refresh and stock management

**Sensor Attributes:**
Each stock sensor exposes these attributes:
- `change`: Absolute price change
- `change_percent`: Percentage change
- `currency`: Trading currency
- `long_name`: Company full name
- `historical_data`: Array of last 5 closing prices (for sparkline)
- `market_state`: Market open/closed status
- `volume`: Trading volume
- `day_high`/`day_low`: Daily price range

### Frontend (`lovelace/stocks-card.js`)

**Features:**
- Custom element extending HTMLElement
- Shadow DOM for style isolation
- CSS variables for Home Assistant theming
- Sparkline generation via SVG
- Refresh button calling `stocks.refresh` service
- Responsive design with mobile breakpoint

## HACS Compliance

**Structure Requirements:**
- Integration code in `custom_components/stocks/`
- Manifest.json with all required fields
- Config Flow for UI-based setup
- Translations in `translations/` (en.json, de.json)
- hacs.json at repository root
- info.md for HACS description

**Key Files:**
- `manifest.json`: Integration metadata, dependencies, codeowners
- `hacs.json`: HACS repository configuration
- `services.yaml`: Exposed services documentation

## Configuration

**Backend (Config Flow):**
Users add stocks via Settings → Devices & Services → Add Integration → HA Stocks

**Frontend Card YAML:**
```yaml
type: custom:stocks-card
title: My Portfolio
stocks:
  - entity: sensor.sap_de
    name: SAP SE
show_sparkline: true
show_currency: true
refresh_interval: 300
```

## Development

**Adding new features:**
1. Backend: Modify `sensor.py` for new attributes, update `const.py` for constants
2. Frontend: Modify `lovelace/stocks-card.js` for new UI elements
3. Translations: Update both `en.json` and `de.json`
4. Services: Add to `__init__.py` and document in `services.yaml`

**Testing:**
- No automated tests - manual testing in Home Assistant
- Copy `custom_components/stocks/` to HA config directory
- Restart HA, add integration via UI
- Check logs for API errors

**Common Symbols:**
- German stocks: `SAP.DE`, `VOW3.DE` (add `.DE` suffix)
- US stocks: `AAPL`, `MSFT` (plain ticker)
- ETFs: `IWDA.AS` (various exchanges)

## Yahoo Finance API

**Endpoint:** `https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?interval=1d&range=5d`

**Response structure:**
- `chart.result[0].meta`: Current price, change, currency, company name
- `chart.result[0].indicators.quote[0].close`: Historical closing prices

**Limitations:**
- Data delayed ~15 minutes
- Rate limiting applies (5-minute default scan interval recommended)
- Unofficial API, may change without notice
