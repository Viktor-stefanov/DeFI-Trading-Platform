// native = blockchain coin, token = smart contract coin
export type AssetType = "native" | "token";
export type OrderSide = "buy" | "sell";
export type OrderStatus = "pending" | "filled" | "rejected";

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  type: AssetType;
  contractAddr?: string;
  decimals: number;
  tokenStandard?: string;
  basePrice: number;
  price: number;
  open24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  change24h?: number;
  minQty?: number;
  maxQty?: number;
  isStableCoin?: boolean;
  qtyPrecision?: number;
  displayPrecision?: number;
  tickWeight: number;
  volatility: number;
  liquidityDepth: number;
  pool?: Pool;
  lastUpdated: string; // ISO timestamp
  history?: HistoryEntry[]; // circular buffer
}

// artificial pools for the constant AMM
export interface Pool {
  baseSymbol: string;
  reserveBase: number;
  reserveToken: number;
  feeRate: number;
}

export interface HistoryEntry {
  ts: string; // ISO timestamp
  price: number;
  volume?: number;
}

export interface TickMessage {
  type: "tick";
  symbol: string;
  price: number;
  volume?: number;
  open24h: number;
  change24hPct: number;
  high24h?: number;
  low24h?: number;
  liquidityDepth: number;
  ts: string;
  pool?: Partial<Pool>;
}

export interface Order {
  id: string;
  clientId?: string;
  symbol: string;
  side: OrderSide;
  qty: number;
  price?: number;
  status: OrderStatus;
  ts: string;
  fee?: number;
  slippagePct?: number;
  notes?: string;
}

export interface StoreRuntime {
  assetsMap: Map<string, Asset>;
  ordersList: Order[];
  // wsClients etc. can be added later
}
