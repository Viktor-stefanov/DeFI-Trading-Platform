import type { Asset, HistoryEntry, Pool } from "../types/models";

const nowSeconds = Math.floor(Date.now() / 1000);

/**
 * Generates a simple random-walk history of price and volume for a given asset.
 *
 * @param basePrice - The starting price for the simulation.
 * @param volatility - The relative size of random price changes per step.
 * @param length - Number of historical data points to generate in secs (default 600)
 * @returns An array of HistoryEntry objects containing timestamped price and volume data.
 */
function generateHistory(
  basePrice: number,
  volatility: number,
  length = 600
): HistoryEntry[] {
  const history: HistoryEntry[] = [];
  let price = basePrice;
  for (let i = length - 1; i >= 0; i--) {
    // simple random walk with small jitter based on volatility
    const jitter = (Math.random() - 0.5) * 2 * volatility * price;
    price = Math.max(0.00000001, price + jitter);
    const ts = new Date((nowSeconds - i) * 1000).toISOString();
    const volume = Math.max(1, Math.round(Math.random() * 1000));
    history.push({ ts, price, volume });
  }
  return history;
}

/**
 * Top 10 crypto assets (seeded) — market-cap informed snapshot
 * Symbols chosen: BTC, ETH, USDT, BNB, XRP, SOL, USDC, ADA, DOGE, TRX
 */
export const assetsList: Asset[] = [
  {
    id: "asset_btc",
    symbol: "BTC",
    name: "Bitcoin",
    chain: "bitcoin",
    type: "native",
    decimals: 8,
    basePrice: 112803.614493347,
    price: 112803.614493347,
    tickWeight: 10,
    volatility: 0.002,
    liquidityDepth: 10_000_000,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(112803.614493347, 0.002, 600),
  },
  {
    id: "asset_eth",
    symbol: "ETH",
    name: "Ethereum",
    chain: "ethereum",
    type: "native",
    decimals: 18,
    basePrice: 4133.1105358015,
    price: 4133.1105358015,
    tickWeight: 9,
    volatility: 0.003,
    liquidityDepth: 8_000_000,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(4133.1105358015, 0.003, 600),
  },
  {
    id: "asset_usdt",
    symbol: "USDT",
    name: "Tether USDt",
    chain: "ethereum",
    type: "token",
    decimals: 6,
    tokenStandard: "ERC20",
    basePrice: 1.0005458683,
    price: 1.0005458683,
    tickWeight: 6,
    volatility: 0.00005,
    liquidityDepth: 5_000_000,
    pool: {
      baseSymbol: "ETH",
      reserveBase: 2000,
      reserveToken: 2_000_000,
      feeRate: 0.001,
    },
    isStableCoin: true,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(1.0005458683, 0.00005, 600),
  },
  {
    id: "asset_bnb",
    symbol: "BNB",
    name: "BNB",
    chain: "bsc",
    type: "native",
    decimals: 18,
    basePrice: 1221.6576705859,
    price: 1221.6576705859,
    tickWeight: 7,
    volatility: 0.004,
    liquidityDepth: 3_000_000,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(1221.6576705859, 0.004, 600),
  },
  {
    id: "asset_xrp",
    symbol: "XRP",
    name: "XRP",
    chain: "ripple",
    type: "native",
    decimals: 6,
    basePrice: 2.5157,
    price: 2.5157,
    tickWeight: 5,
    volatility: 0.006,
    liquidityDepth: 2_000_000,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(2.5157, 0.006, 600),
  },
  {
    id: "asset_sol",
    symbol: "SOL",
    name: "Solana",
    chain: "solana",
    type: "native",
    decimals: 9,
    basePrice: 195.07,
    price: 195.07,
    tickWeight: 5,
    volatility: 0.007,
    liquidityDepth: 2_000_000,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(195.07, 0.007, 600),
  },
  {
    id: "asset_usdc",
    symbol: "USDC",
    name: "USD Coin",
    chain: "ethereum",
    type: "token",
    decimals: 6,
    tokenStandard: "ERC20",
    basePrice: 1.00049,
    price: 1.00049,
    tickWeight: 6,
    volatility: 0.00005,
    liquidityDepth: 5_000_000,
    pool: {
      baseSymbol: "ETH",
      reserveBase: 1800,
      reserveToken: 1_800_000,
      feeRate: 0.001,
    },
    isStableCoin: true,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(1.00049, 0.00005, 600),
  },
  {
    id: "asset_ada",
    symbol: "ADA",
    name: "Cardano",
    chain: "cardano",
    type: "native",
    decimals: 6,
    basePrice: 0.7015,
    price: 0.7015,
    tickWeight: 4,
    volatility: 0.006,
    liquidityDepth: 1_000_000,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(0.7015, 0.006, 600),
  },
  {
    id: "asset_doge",
    symbol: "DOGE",
    name: "Dogecoin",
    chain: "dogecoin",
    type: "native",
    decimals: 8,
    basePrice: 0.199459,
    price: 0.199459,
    tickWeight: 4,
    volatility: 0.01,
    liquidityDepth: 1_000_000,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(0.199459, 0.01, 600),
  },
  {
    id: "asset_trx",
    symbol: "TRX",
    name: "TRON",
    chain: "tron",
    type: "native",
    decimals: 6,
    basePrice: 0.3414,
    price: 0.3414,
    tickWeight: 3,
    volatility: 0.007,
    liquidityDepth: 800_000,
    lastUpdated: new Date().toISOString(),
    history: generateHistory(0.3414, 0.007, 600),
  },
];

export const assetsMap: Map<string, Asset> = new Map(
  assetsList.map((a) => [a.symbol, a])
);
