# Home Assistant Stocks Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2023.1+-blue.svg?style=for-the-badge)](https://www.home-assistant.io/)

A professional stock tracking integration for Home Assistant with a beautiful Lovelace card.

## Features

- 📈 **Real-time stock data** from Yahoo Finance API
- 🎨 **Beautiful sparkline charts** showing 5-day price trends
- ⚙️ **Config Flow UI** for easy setup (no YAML editing required)
- 🌍 **Multi-language support** (English and German)
- 📱 **Responsive design** optimized for mobile and desktop
- 🔄 **Auto-refresh** with configurable intervals
- 💼 **Multiple stocks** with individual configuration
- 🏪 **HACS compatible** for easy installation
- 🔧 **Services** for programmatic control

## Installation

### Via HACS (Recommended)

1. Open **HACS** → **Integrations**
2. Click the **"+"** button to add a custom repository
3. Enter repository URL: `https://github.com/steuerlexi/ha-stocks-card`
4. Select **Integration** as category
5. Click **Download**
6. Restart Home Assistant

### Manual Installation

1. Download the latest release
2. Copy the `custom_components/stocks/` folder to your Home Assistant `custom_components/` directory
3. Restart Home Assistant

## Setup

After installation:

1. Go to **Settings** → **Devices & Services**
2. Click **Add Integration**
3. Search for **"HA Stocks"**
4. Enter your stock symbol (e.g., `SAP.DE`, `AAPL`, `VOW3.DE`)
5. Optionally enter a display name
6. Click **Submit**

Repeat for each stock you want to track.

## Card Configuration

The integration automatically sets up the Lovelace card. To add it manually:

### UI Configuration

1. Edit your dashboard
2. Click **Add Card**
3. Select **"Stocks Card"**

### YAML Configuration

```yaml
type: custom:stocks-card
title: My Portfolio
stocks:
  - entity: sensor.sap_de
    name: SAP SE
  - entity: sensor.vow3_de
    name: Volkswagen
  - entity: sensor.iwda_as
    name: MSCI World
show_sparkline: true
show_currency: true
show_change: true
show_volume: false
show_day_range: false
refresh_interval: 300
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | "My Portfolio" | Card title |
| `stocks` | array | required | List of stock entities |
| `show_sparkline` | boolean | true | Show sparkline chart |
| `show_currency` | boolean | true | Show currency symbol |
| `show_change` | boolean | true | Show price change |
| `show_volume` | boolean | false | Show trading volume |
| `show_day_range` | boolean | false | Show day high/low |
| `refresh_interval` | number | 300 | UI refresh interval in seconds |

## Services

### `stocks.refresh`

Manually refresh all stock data.

```yaml
service: stocks.refresh
data: {}
```

### `stocks.add_stock`

Add a new stock dynamically.

```yaml
service: stocks.add_stock
data:
  symbol: "SAP.DE"
  name: "SAP SE"
```

### `stocks.remove_stock`

Remove a stock.

```yaml
service: stocks.remove_stock
data:
  symbol: "SAP.DE"
```

## Stock Symbols

Common symbols for popular stocks:

| Company | Symbol |
|-----------|--------|
| SAP | `SAP.DE` |
| Volkswagen | `VOW3.DE` |
| Allianz | `ALV.DE` |
| Apple | `AAPL` |
| Microsoft | `MSFT` |
| iShares MSCI World | `IWDA.AS` |

For other stocks, search on [Yahoo Finance](https://finance.yahoo.com).

## Supported Exchanges

- 🇩🇪 Deutsche Börse (XETRA) - add `.DE` suffix
- 🇺🇸 US Stocks - use standard ticker
- 🇬🇧 London Stock Exchange - add `.L` suffix
- 🇨🇭 Swiss Exchange - add `.SW` suffix
- 🇦🇹 Vienna Stock Exchange - add `.VI` suffix
- And many more...

## Troubleshooting

### Entity not found

- Verify the stock symbol is correct on Yahoo Finance
- Check that the integration is properly set up in Settings → Devices & Services

### No data displayed

- Check Home Assistant logs for API errors
- Verify your internet connection
- Yahoo Finance data may be delayed ~15 minutes

### Card not showing

- Ensure the integration is installed
- Clear browser cache
- Check browser console for JavaScript errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Disclaimer

Stock data is provided by Yahoo Finance. This is an unofficial API and may change without notice. Use at your own risk for personal use only.

---

Made with ❤️ for the Home Assistant community
