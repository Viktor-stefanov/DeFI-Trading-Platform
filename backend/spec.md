# Data model and specification

## Asset - representing a token or coin

| Property          |  Required   | Description                                                                               |
| ----------------- | :---------: | ----------------------------------------------------------------------------------------- |
| id                |     yes     | Unique internal id (string). Use for fast lookup and stable identity.                     |
| symbol            |     yes     | Ticker symbol (e.g., USDC, ETH).                                                          |
| name              |     yes     | Human-readable name (e.g., USD Coin).                                                     |
| chain             |     yes     | Canonical chain for UI badge (e.g., `ethereum`, `solana`).                                |
| type              |     yes     | `native` or `token`.                                                                      |
| contractAddr      | conditional | Contract address (required when `type === token`).                                        |
| decimals          |     yes     | Token decimals (formatting/validation).                                                   |
| tokenStandard     |     no      | Optional standard (ERC20, SPL, etc.).                                                     |
| basePrice         |     yes     | Startup baseline price in USD used to seed simulation.                                    |
| price             |     yes     | Current live price in USD (will be updated by the ticker).                                |
| open24h           |     no      | Price 24h ago (used to compute 24h change). Can be derived at startup.                    |
| high24h           |     no      | Highest price in the last 24 hours (derived/updated).                                     |
| low24h            |     no      | Lowest price in the last 24 hours (derived/updated).                                      |
| volume24h         |     no      | 24h traded volume (simulated).                                                            |
| change24h         |     no      | 24h percent change (derived from price & open24h).                                        |
| minQty            |     no      | Minimum orderable quantity (asset units).                                                 |
| maxQty            |     no      | Maximum orderable quantity (asset units).                                                 |
| isStableCoin      |     no      | Hint for very low volatility (boolean).                                                   |
| qtyPrecision      |     no      | Allowed decimals in quantity input (UI validation).                                       |
| displayPrecision  |     no      | Decimal places to display the price in the UI (presentation).                             |
| tickWeight        |     yes     | Relative frequency weight for server tick emission (controls update frequency).           |
| volatility        |     yes     | Controls random-walk step size (how big ticks move).                                      |
| liquidityDepth    |     yes     | Abstract liquidity score used by simple slippage formula (or to initialize AMM reserves). |
| pool.baseSymbol   | conditional | Base asset symbol used by the AMM pool (required if AMM is used).                         |
| pool.reserveBase  | conditional | Pool reserve of base asset (required if AMM is used).                                     |
| pool.reserveToken | conditional | Pool reserve of token asset (required if AMM is used).                                    |
| pool.feeRate      | conditional | Pool fee fraction (e.g., 0.003). Required if AMM is used.                                 |
| lastUpdated       |     yes     | ISO timestamp for most recent tick. Initialize at boot.                                   |
| history           |     no      | Circular buffer of recent ticks (price, volume, ts); recommended to enable charts.        |

## Order - representing an interaction with an asset

| Property    |   Required   | Description                                                                 |
| ----------- | :----------: | --------------------------------------------------------------------------- |
| id          | yes (server) | Server-generated unique order id (string).                                  |
| clientId    |      no      | Client-generated optimistic id to match placeholder (string).               |
| symbol      |     yes      | Symbol being traded (must be in asset whitelist).                           |
| side        |     yes      | `buy` or `sell`.                                                            |
| qty         |     yes      | Quantity of the asset.                                                      |
| price       | conditional  | Execution price (filled orders). For `pending` may be empty until executed. |
| status      |     yes      | `pending`, `filled`, or `rejected`.                                         |
| ts          |     yes      | Server timestamp when order processed (ISO).                                |
| fee         |      no      | Execution fee (USD or token units).                                         |
| slippagePct |      no      | Slippage percentage applied relative to the mid price.                      |
| notes       |      no      | Human-readable message for rejections or special cases.                     |

### Sensible default values

- WS flush/batch on client: 150 ms (client-side batching cadence)
- Server tick emission total: 30 messages/sec across assets (adjust by
  tickWeight)
- AMM feeRate default: 0.003 (0.3%)
- Stability/volatility:
- Stablecoin volatility: 0.0001–0.0005 per tick
- Typical token volatility: 0.001–0.005 per tick
- LiquidityDepth example range: 10k (thin) — 10M (deep)
- history buffer length: 300–1,800 entries (5–30 minutes at 1s resolution)

### API specification

Return type of `/ws/tick`:

| Property         |                Type |  Required   | Description                                                                     |
| ---------------- | ------------------: | :---------: | ------------------------------------------------------------------------------- |
| `type`           |              string |     yes     | `"tick"` — message type discriminator.                                          |
| `symbol`         |              string |     yes     | Asset symbol (e.g., `"ETH"`).                                                   |
| `price`          |              number |     yes     | Latest price in USD.                                                            |
| `volume`         |              number |     no      | Tick volume or recent volume bucket (optional).                                 |
| `open24h`        |              number |     no      | Price 24h ago (helps client compute change).                                    |
| `change24hPct`   |              number |     no      | Percent change vs `open24h` (optional convenience).                             |
| `high24h`        |              number |     no      | 24h high (optional).                                                            |
| `low24h`         |              number |     no      | 24h low (optional).                                                             |
| `liquidityDepth` |              number |     no      | Abstract liquidity score (used by UI/slippage hint).                            |
| `pool`           |              object | conditional | Optional pool snapshot `{ reserveBase, reserveToken, feeRate }` when using AMM. |
| `ts`             |        string (ISO) |     yes     | Timestamp of this tick message.                                                 |
| `lastUpdated`    |        string (ISO) |     no      | Asset `lastUpdated` (may be same as `ts`).                                      |
| `historySample`  | array of {ts,price} |     no      | Optional compact recent history for client charts (small window).               |
