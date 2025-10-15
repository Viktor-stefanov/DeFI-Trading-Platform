export interface Asset {
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24hPct: number;
  volume24h: number;
  priceHistory?: number[];
  lastChangeAt?: number | null;
  lastChangeDirection?: "up" | "down" | null;
}

export interface Order {
  id: string;
  clientId: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  status: "pending" | "filled" | "rejected";
  ts: string;
}
