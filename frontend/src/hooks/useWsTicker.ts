import { useEffect, useRef } from "react";
import { useAssetsStore } from "../stores/assets";
import { useWsStore } from "../stores/ws";

interface TickMessage {
  type: "tick";
  symbol: string;
  price: number;
  volume?: number;
  change24hPct?: number;
  high24h?: number;
  low24h?: number;
}

export const useWsTicker = (url: string) => {
  const updateAsset = useAssetsStore.getState().updateAsset;
  const setConnected = useWsStore.getState().setConnected;
  const setError = useWsStore.getState().setError;

  const wsRef = useRef<WebSocket | null>(null);
  const tickBufferRef = useRef<Record<string, TickMessage>>({}); // buffer latest tick per symbol
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    console.log(`url=${url}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "tick") {
          tickBufferRef.current[data.symbol] = data;
          // schedule RAF flush if not already scheduled
          if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(() => {
              const buffer = { ...tickBufferRef.current };
              tickBufferRef.current = {};
              rafRef.current = null;

              // Apply batched updates
              Object.values(buffer).forEach((tick) => {
                updateAsset(tick.symbol, {
                  price: tick.price,
                  volume24h: tick.volume ?? 0,
                  change24hPct: tick.change24hPct ?? 0,
                  high24h: tick.high24h,
                  low24h: tick.low24h,
                });
              });
            });
          }
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setError("WebSocket disconnected");
    };

    ws.onerror = (err) => {
      console.error("WS error", err);
      setError("WebSocket error");
      ws.close();
    };

    return () => {
      ws.close();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [url, updateAsset, setConnected, setError]);
};
