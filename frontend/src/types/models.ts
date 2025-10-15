export type Asset = {
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24hPct: number;
  volume24h: number;
  priceHistory?: number[];
  lastChangeAt?: number | null;
  lastChangeDirection?: "up" | "down" | null;
};

export type Order = {
  id?: string;
  clientId?: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price?: number;
  status: "pending" | "filled" | "rejected";
  filledQty?: number;
  avgPrice?: number;
  ts?: string;
  notes?: string;
};
