/**
 * Stocks Card for Home Assistant Lovelace
 * A modern, feature-rich card for displaying stock prices with sparklines
 */
class StocksCard extends HTMLElement {
    constructor() {
        super();
        this._config = null;
        this._hass = null;
        this._root = null;
        this._refreshInterval = null;
    }

    static getConfigElement() {
        return document.createElement("stocks-card-editor");
    }

    static getStubConfig() {
        return {
            title: "My Portfolio",
            stocks: [],
            show_sparkline: true,
            show_currency: true,
            show_change: true,
            show_volume: false,
            refresh_interval: 300
        };
    }

    setConfig(config) {
        if (!config) {
            throw new Error("Configuration error: config is required");
        }

        if (!config.stocks || !Array.isArray(config.stocks)) {
            throw new Error("Configuration error: 'stocks' must be an array of entity IDs");
        }

        this._config = {
            title: "My Portfolio",
            show_sparkline: true,
            show_currency: true,
            show_change: true,
            show_volume: false,
            refresh_interval: 300,
            ...config
        };

        this._clearRefresh();
    }

    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;

        if (!oldHass) {
            this._createRoot();
        }

        this.render();
        this._startRefresh();
    }

    getCardSize() {
        return Math.max(3, (this._config?.stocks?.length || 0) * 2 + 1);
    }

    _createRoot() {
        if (this._root) return;

        this._root = this.attachShadow({ mode: "open" });
        this._root.innerHTML = `
            <style>
                :host {
                    display: block;
                    --stocks-positive-color: var(--state-icon-active-color, #4caf50);
                    --stocks-negative-color: var(--state-icon-unavailable-color, #f44336);
                    --stocks-card-padding: 16px;
                    --stocks-item-padding: 12px 16px;
                }

                ha-card {
                    background: var(--card-background-color, var(--primary-background-color, white));
                    border-radius: var(--ha-card-border-radius, 12px);
                    box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
                    overflow: hidden;
                    transition: box-shadow 0.3s ease;
                }

                ha-card:hover {
                    box-shadow: var(--ha-card-box-shadow-hover, 0 4px 16px rgba(0,0,0,0.15));
                }

                .card-header {
                    padding: var(--stocks-card-padding);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.12));
                }

                .card-title {
                    font-size: 1.2em;
                    font-weight: 500;
                    color: var(--primary-text-color, #212121);
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .card-title ha-icon {
                    color: var(--primary-color, #03a9f4);
                }

                .refresh-btn {
                    background: transparent;
                    border: none;
                    color: var(--secondary-text-color, #757575);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .refresh-btn:hover {
                    background-color: var(--divider-color, rgba(0,0,0,0.08));
                }

                .refresh-btn.loading {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .stocks-container {
                    display: flex;
                    flex-direction: column;
                }

                .stock-item {
                    display: flex;
                    align-items: center;
                    padding: var(--stocks-item-padding);
                    border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.08));
                    transition: background-color 0.2s;
                }

                .stock-item:last-child {
                    border-bottom: none;
                }

                .stock-item:hover {
                    background-color: var(--secondary-background-color, rgba(0,0,0,0.03));
                }

                .stock-main {
                    flex: 1;
                    min-width: 0;
                }

                .stock-header {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .stock-name {
                    font-size: 1em;
                    font-weight: 500;
                    color: var(--primary-text-color, #212121);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .stock-symbol {
                    font-size: 0.75em;
                    color: var(--secondary-text-color, #757575);
                    text-transform: uppercase;
                }

                .stock-price-section {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .stock-price {
                    font-size: 1.4em;
                    font-weight: 600;
                    color: var(--primary-text-color, #212121);
                }

                .stock-currency {
                    font-size: 0.7em;
                    color: var(--secondary-text-color, #757575);
                    margin-left: 2px;
                }

                .stock-change {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9em;
                    font-weight: 500;
                }

                .stock-change.positive {
                    color: var(--stocks-positive-color);
                }

                .stock-change.negative {
                    color: var(--stocks-negative-color);
                }

                .change-arrow {
                    font-size: 0.8em;
                }

                .stock-sparkline {
                    flex-shrink: 0;
                    margin-left: 16px;
                }

                .stock-extra-info {
                    width: 100%;
                    margin-top: 8px;
                    display: flex;
                    gap: 16px;
                    font-size: 0.8em;
                    color: var(--secondary-text-color, #757575);
                }

                .extra-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .market-open {
                    color: var(--stocks-positive-color);
                }

                .market-closed {
                    color: var(--stocks-negative-color);
                }

                .error-message {
                    padding: 16px;
                    text-align: center;
                    color: var(--error-color, #f44336);
                }

                .no-stocks {
                    padding: 24px;
                    text-align: center;
                    color: var(--secondary-text-color, #757575);
                }

                /* Responsive */
                @media (max-width: 400px) {
                    .stock-item {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .stock-sparkline {
                        margin-left: 0;
                        margin-top: 12px;
                        align-self: flex-end;
                    }
                }

                /* Tooltip */
                .tooltip {
                    position: relative;
                }

                .tooltip:hover::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 4px 8px;
                    background: var(--primary-text-color, #212121);
                    color: var(--card-background-color, white);
                    font-size: 0.75em;
                    border-radius: 4px;
                    white-space: nowrap;
                    z-index: 1;
                }
            </style>
            <ha-card>
                <div class="card-header">
                    <div class="card-title">
                        <ha-icon icon="mdi:chart-line"></ha-icon>
                        <span class="title-text"></span>
                    </div>
                    <button class="refresh-btn tooltip" data-tooltip="Refresh">
                        <ha-icon icon="mdi:refresh"></ha-icon>
                    </button>
                </div>
                <div class="stocks-container"></div>
            </ha-card>
        `;

        // Add refresh button handler
        const refreshBtn = this._root.querySelector(".refresh-btn");
        refreshBtn.addEventListener("click", () => this._refreshData());

        this._stocksContainer = this._root.querySelector(".stocks-container");
        this._titleText = this._root.querySelector(".title-text");
    }

    render() {
        if (!this._hass || !this._root) return;

        const { _config, _hass } = this;

        // Update title
        this._titleText.textContent = _config.title || "My Portfolio";

        // Clear container
        this._stocksContainer.innerHTML = "";

        if (!_config.stocks || _config.stocks.length === 0) {
            this._stocksContainer.innerHTML = `
                <div class="no-stocks">
                    <ha-icon icon="mdi:chart-line" style="font-size: 2em; margin-bottom: 8px; display: block;"></ha-icon>
                    No stocks configured. Add stocks in the card configuration.
                </div>
            `;
            return;
        }

        // Render each stock
        _config.stocks.forEach((stockConfig, index) => {
            const stockEl = this._renderStock(stockConfig, index);
            this._stocksContainer.appendChild(stockEl);
        });
    }

    _renderStock(stockConfig, index) {
        const entityId = typeof stockConfig === "string" ? stockConfig : stockConfig.entity;
        const customName = typeof stockConfig === "object" ? stockConfig.name : null;
        const customShowSparkline = typeof stockConfig === "object" && stockConfig.show_sparkline !== undefined
            ? stockConfig.show_sparkline
            : this._config.show_sparkline;

        const state = this._hass.states[entityId];
        const div = document.createElement("div");
        div.className = "stock-item";

        if (!state) {
            div.innerHTML = `
                <div class="stock-main">
                    <div class="stock-name">Entity not found</div>
                    <div class="stock-symbol">${entityId}</div>
                </div>
            `;
            return div;
        }

        const attrs = state.attributes;
        const name = customName || attrs.long_name || attrs.longName || entityId;
        const symbol = attrs.symbol || entityId.split(".").pop();
        const price = parseFloat(state.state) || 0;
        const change = parseFloat(attrs.change) || 0;
        const changePct = parseFloat(attrs.change_percent || attrs.changePercent) || 0;
        const currency = attrs.currency || "";
        const historicalData = attrs.historical_data || attrs.historicalData || [];
        const marketState = attrs.market_state || attrs.marketState || "CLOSED";
        const volume = attrs.volume || 0;
        const dayHigh = attrs.day_high || attrs.dayHigh || 0;
        const dayLow = attrs.day_low || attrs.dayLow || 0;

        const isPositive = change >= 0;
        const changeClass = isPositive ? "positive" : "negative";
        const arrow = isPositive ? "↑" : "↓";

        // Format numbers
        const formattedPrice = price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const formattedChange = Math.abs(change).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const formattedChangePct = Math.abs(changePct).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Build HTML
        let html = `
            <div class="stock-main">
                <div class="stock-header">
                    <span class="stock-name">${this._escapeHtml(name)}</span>
                    <span class="stock-symbol">${this._escapeHtml(symbol)}</span>
                </div>
                <div class="stock-price-section">
                    <span class="stock-price">
                        ${formattedPrice}
                        ${this._config.show_currency !== false && currency ? `<span class="stock-currency">${this._escapeHtml(currency)}</span>` : ""}
                    </span>
                    ${this._config.show_change !== false ? `
                        <span class="stock-change ${changeClass}">
                            <span class="change-arrow">${arrow}</span>
                            ${formattedChange} (${formattedChangePct}%)
                        </span>
                    ` : ""}
                </div>
        `;

        // Extra info (volume, day high/low)
        if (this._config.show_volume || this._config.show_day_range) {
            html += `<div class="stock-extra-info">`;

            if (this._config.show_volume && volume) {
                const formattedVolume = this._formatNumber(volume);
                html += `
                    <span class="extra-item tooltip" data-tooltip="Volume">
                        <ha-icon icon="mdi:chart-bar" style="font-size: 1em;"></ha-icon>
                        ${formattedVolume}
                    </span>
                `;
            }

            if (this._config.show_day_range && dayHigh && dayLow) {
                html += `
                    <span class="extra-item tooltip" data-tooltip="Day Range">
                        <ha-icon icon="mdi:arrow-expand-vertical" style="font-size: 1em;"></ha-icon>
                        ${dayLow.toFixed(2)} - ${dayHigh.toFixed(2)}
                    </span>
                `;
            }

            html += `</div>`;
        }

        html += `</div>`;

        // Sparkline
        if (customShowSparkline !== false && historicalData.length > 1) {
            const sparklineSvg = this._generateSparkline(historicalData, isPositive);
            html += `<div class="stock-sparkline">${sparklineSvg}</div>`;
        }

        div.innerHTML = html;
        return div;
    }

    _generateSparkline(data, isPositive) {
        if (!data || data.length < 2) return "";

        const width = 80;
        const height = 30;
        const padding = 2;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        // Generate points
        const points = data.map((value, index) => {
            const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((value - min) / range) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(" ");

        const stroke = isPositive ? "var(--stocks-positive-color)" : "var(--stocks-negative-color)";

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradient-${isPositive ? "pos" : "neg"}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${isPositive ? "#4caf50" : "#f44336"};stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:${isPositive ? "#4caf50" : "#f44336"};stop-opacity:0" />
                    </linearGradient>
                </defs>
                <polyline
                    fill="none"
                    stroke="${stroke}"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    points="${points}"
                />
            </svg>
        `;
    }

    _formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    }

    _escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    _refreshData() {
        const refreshBtn = this._root.querySelector(".refresh-btn");
        refreshBtn.classList.add("loading");

        // Call the refresh service
        this._hass.callService("stocks", "refresh").then(() => {
            setTimeout(() => {
                refreshBtn.classList.remove("loading");
            }, 500);
        }).catch(() => {
            refreshBtn.classList.remove("loading");
        });
    }

    _startRefresh() {
        this._clearRefresh();

        const interval = this._config?.refresh_interval || 300;
        if (interval > 0) {
            this._refreshInterval = setInterval(() => {
                this.render();
            }, interval * 1000);
        }
    }

    _clearRefresh() {
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
            this._refreshInterval = null;
        }
    }

    connectedCallback() {
        this._startRefresh();
    }

    disconnectedCallback() {
        this._clearRefresh();
    }
}

// Register the custom element
customElements.define("stocks-card", StocksCard);

// HACS compatibility
customElements.define(
    "stocks-card-editor",
    class extends HTMLElement {
        setConfig(config) {
            this._config = config;
        }

        configChanged(newConfig) {
            const event = new Event("config-changed", {
                bubbles: true,
                composed: true
            });
            event.detail = { config: newConfig };
            this.dispatchEvent(event);
        }
    }
);

// Export for potential module use
if (typeof module !== "undefined" && module.exports) {
    module.exports = { StocksCard };
}
