import dotenv from "dotenv";
import logger from "../utils/logger";
import { WebSocket } from "ws";

export interface BinanceTickerPayload {
  e: "1hTicker";
  E: number;
  s: string;
  p: string;
  P: string;
  o: string;
  h: string;
  l: string;
  c: string;
  w: string;
  v: string;
  q: string;
  O: number;
  C: number;
  F: number;
  L: number;
  n: number;
}

dotenv.config();

const BINANCE_WS_URL =
  process.env.BINANCE_WS_URL ||
  "wss://stream.binance.com:9443/ws/btcusdt@trade";

export function startBinanceStream(onMessage: (payload: any) => void) {
  const ws = new WebSocket(BINANCE_WS_URL);

  ws.on("open", () => {
    logger.info("[binanceWsService] Connected to Binance WebSocket");
  });

  ws.on("message", (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      onMessage(parsed);
      logger.debug("[binanceWsService] Received data");
    } catch (error) {
      logger.error("[binanceWsService] Error parsing WebSocket message", {
        error,
      });
    }
  });

  ws.on("error", (err) => {
    logger.error("[binanceWsService] WebSocket error", { error: err });
  });

  ws.on("close", () => {
    logger.warn("[binanceWsService] WebSocket connection closed");
  });
}
