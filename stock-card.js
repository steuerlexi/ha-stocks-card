/**
 * Stock Card for Home Assistant Lovelace
 * Displays stock prices with sparkline from Yahoo Finance via REST sensors
 */
class StockCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.stocks) {
      throw new Error('Configuration error: stocks array required');
    }
    this._config = config;
    this._refreshInterval = null;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
    this.startRefresh();
  }

  startRefresh() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
    const interval = this._config.refresh_interval || 300; // default 5 minutes
    this._refreshInterval = setInterval(() => {
      this.requestUpdate();
    }, interval * 1000);
  }

  disconnectedCallback() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
  }

  requestUpdate() {
    if (this._hass) {
      this.render();
    }
  }

  render() {
    if (!this._hass) {
      return;
    }

    const config = this._config;
    const stocks = config.stocks;

    // Create root element if not exists
    if (!this._root) {
      this._root = this.attachShadow({ mode: 'open' });
      this._root.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 8px;
            font-family: var(--paper-font-body1, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif);
          }
          .card {
            background: var(--card-background, var(--background-color, white));
            border-radius: var(--border-radius, 4px);
            box-shadow: var(--card-shadow, 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12), 0 3px 1px -2px rgba(0,0,0,.2));
            overflow: hidden;
          }
          .header {
            padding: 12px 16px;
            font-size: 1.1em;
            font-weight: 500;
            color: var(--primary-text-color, var(--text-primary-color, black));
            border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12));
          }
          .stocks {
            display: flex;
            flex-direction: column;
          }
          .stock-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12));
          }
          .stock-item:last-child {
            border-bottom: none;
          }
          .stock-info {
            flex: 1;
            min-width: 0;
          }
          .stock-name {
            font-size: 0.95em;
            color: var(--primary-text-color, var(--text-primary-color, black));
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .stock-price {
            font-size: 1.2em;
            font-weight: 500;
            color: var(--primary-text-color, var(--text-primary-color, black));
          }
          .stock-change {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9em;
            margin-top: 4px;
          }
          .change-value {
            font-weight: 500;
          }
          .change-positive {
            color: var(--state-icon-active-color, green);
          }
          .change-negative {
            color: var(--state-icon-unactive-color, red);
          }
          .sparkline {
            width: 60px;
            height: 20px;
            flex-shrink: 0;
          }
          .currency {
            font-size: 0.9em;
            opacity: 0.8;
            margin-left: 4px;
          }
          @media (max-width: 400px) {
            .stock-item {
              flex-direction: column;
              align-items: flex-start;
            }
            .stock-info {
              width: 100%;
              margin-bottom: 8px;
            }
            .sparkline {
              align-self: flex-end;
            }
          }
        </style>
        <div class="card">
          <div class="header">${config.title || 'Mein Portfolio'}</div>
          <div class="stocks">
            ${stocks.map(stock => this.renderStockItem(stock)).join('')}
          </div>
        </div>
      `;
    } else {
      this._root.querySelector('.header').textContent = config.title || 'Mein Portfolio';
      const stocksContainer = this._root.querySelector('.stocks');
      stocksContainer.innerHTML = stocks.map(stock => this.renderStockItem(stock)).join('');
    }
  }

  renderStockItem(stockConfig) {
    const entityId = stockConfig.entity;
    if (!entityId) {
      return '<div class="stock-item">Missing entity configuration</div>';
    }

    const state = this._hass.states[entityId];
    if (!state) {
      return `<div class="stock-item">Entity not found: ${entityId}</div>`;
    }

    // Get attributes
    const attrs = state.attributes;
    const name = stockConfig.name || attrs.longName || entityId;
    const price = state.state || '0';
    const change = attrs.change || '0';
    const changePct = attrs.change_percent || '0';
    const currency = attrs.currency || '';
    const historicalDataStr = attrs.historical_data || '[]';

    // Parse historical data (JSON string)
    let historicalData = [];
    try {
      historicalData = JSON.parse(historicalDataStr);
    } catch (e) {
      console.warn('Failed to parse historical data:', e);
    }

    // Determine change color class
    const changeNum = parseFloat(change);
    const changeClass = changeNum >= 0 ? 'change-positive' : 'change-negative';

    // Format numbers
    const formattedPrice = parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedChange = Math.abs(changeNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedChangePct = Math.abs(parseFloat(changePct)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

    // Generate sparkline SVG
    const sparklineSvg = this._config.show_sparkline !== false && historicalData.length > 0
      ? this.generateSparklineSvg(historicalData)
      : '';

    return `
      <div class="stock-item">
        <div class="stock-info">
          <div class="stock-name">${name}</div>
          <div class="stock-price">
            ${formattedPrice}
            ${this._config.show_currency !== false && currency ? `<span class="currency"> ${currency}</span>` : ''}
          </div>
          <div class="stock-change">
            <span class="change-value ${changeClass}">${formattedChange} (${formattedChangePct})</span>
            ${sparklineSvg}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate a simple sparkline SVG from an array of numbers
   * @param {number[]} data - Array of numeric values
   * @returns {string} SVG string
   */
  generateSparklineSvg(data) {
    if (!data || data.length < 2) return '';

    const width = 60;
    const height = 20;
    const padding = 2;

    // Find min and max
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // Handle flat data
    const adjustedRange = range === 0 ? 1 : range;

    // Create points for the polyline
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - min) / adjustedRange) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    // Determine color based on trend (last vs first)
    const first = data[0];
    const last = data[data.length - 1];
    const stroke = last >= first ? 'var(--state-icon-active-color, green)' : 'var(--state-icon-unactive-color, red)';

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="sparkline">
      <polyline fill="none" stroke="${stroke}" stroke-width="1.5" points="${points}" />
    </svg>`;
  }
}

// Register the custom element
customElements.define('stock-card', StockCard);