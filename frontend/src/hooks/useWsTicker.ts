import { useCallback, useEffect, useRef } from "react";
import { useWsStore } from "../stores/ws";
import { useAssetsStore } from "../stores/assets";
import type { Asset } from "../types/models";

type TickMsg = {
  type?: "tick";
  symbol: string;
  price?: number;
  volume?: number;
  volume24h?: number;
  change24hPct?: number;
};

const FLASH_MS = 800;

export function useWsTicker(url = "ws://localhost:4000/ws/ticker?token=demo") {
  const wsRef = useRef<WebSocket | null>(null);

  const setConnected = useWsStore((s) => s.setConnected);
  const setError = useWsStore((s) => s.setError);
  const setAssets = useAssetsStore((s) => s.setAssets);
  const updateAsset = useAssetsStore((s) => s.updateAsset);
  const assetsGetState = useAssetsStore.getState;

  // pending tick merge debouncing
  const pendingTicksRef = useRef<Map<string, TickMsg>>(new Map());
  const pendingTimersRef = useRef<Map<string, number>>(new Map());

  // flash clear timers to remove highlight after FLASH_MS
  const flashClearTimersRef = useRef<Map<string, number>>(new Map());

  const tickToAsset = (t: TickMsg): Asset => ({
    symbol: t.symbol,
    name: t.symbol,
    chain: "",
    price: typeof t.price === "number" ? t.price : 0,
    change24hPct: typeof t.change24hPct === "number" ? t.change24hPct : 0,
    volume24h:
      typeof t.volume24h === "number"
        ? t.volume24h
        : typeof t.volume === "number"
        ? t.volume
        : 0,
    priceHistory: t.price ? [t.price] : undefined,
    lastChangeAt: null,
    lastChangeDirection: null,
  });

  const upsertTickImmediate = (t: TickMsg) => {
    const symbol = t.symbol;
    const state = assetsGetState();
    const existing = state.assetsMap[symbol];

    if (existing) {
      const partial: Partial<Asset> = {};
      let dir: "up" | "down" | null = null;
      if (typeof t.price === "number") {
        if (typeof existing.price === "number") {
          if (t.price > existing.price) dir = "up";
          else if (t.price < existing.price) dir = "down";
        }
        partial.price = t.price;
      }
      if (typeof t.change24hPct === "number")
        partial.change24hPct = t.change24hPct;
      if (typeof t.volume === "number") partial.volume24h = t.volume;
      if (typeof t.volume24h === "number") partial.volume24h = t.volume24h;

      if (dir) {
        partial.lastChangeAt = Date.now();
        partial.lastChangeDirection = dir;
      }

      updateAsset(symbol, partial);

      if (dir) {
        const existingClear = flashClearTimersRef.current.get(symbol);
        if (existingClear !== undefined) {
          clearTimeout(existingClear);
          flashClearTimersRef.current.delete(symbol);
        }
        const clearId = window.setTimeout(() => {
          updateAsset(symbol, {
            lastChangeAt: null,
            lastChangeDirection: null,
          });
          flashClearTimersRef.current.delete(symbol);
        }, FLASH_MS);
        flashClearTimersRef.current.set(symbol, clearId);
      }

      return;
    }

    // new asset — append to list
    const newAsset = tickToAsset(t);
    const allAssets = Object.values(state.assetsMap).concat(newAsset);
    setAssets(allAssets);
  };

  const scheduleTickUpdate = (tick: TickMsg) => {
    const symbol = tick.symbol;
    pendingTicksRef.current.set(symbol, tick);

    const existingTimerId = pendingTimersRef.current.get(symbol);
    if (existingTimerId !== undefined) {
      clearTimeout(existingTimerId);
      pendingTimersRef.current.delete(symbol);
    }

    const delayMs = 500 + Math.floor(Math.random() * 1501); // 500..2000ms randomized

    const timerId = window.setTimeout(() => {
      try {
        const latest = pendingTicksRef.current.get(symbol);
        if (latest) {
          upsertTickImmediate(latest);
        }
      } catch (err) {
        setError(String((err as Error)?.message ?? err));
      } finally {
        pendingTicksRef.current.delete(symbol);
        pendingTimersRef.current.delete(symbol);
      }
    }, delayMs);

    pendingTimersRef.current.set(symbol, timerId);
  };

  const connect = useCallback(() => {
    for (const tid of pendingTimersRef.current.values()) clearTimeout(tid);
    pendingTimersRef.current.clear();
    pendingTicksRef.current.clear();

    for (const tid of flashClearTimersRef.current.values()) clearTimeout(tid);
    flashClearTimersRef.current.clear();

    wsRef.current?.close();

    if (!url) {
      setError("No websocket URL supplied");
      setConnected(false);
      return;
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setError(null);
      setConnected(true);
    };

    ws.onmessage = (ev: MessageEvent) => {
      try {
        const raw =
          typeof ev.data === "string"
            ? ev.data
            : new TextDecoder().decode(ev.data as ArrayBuffer);
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          for (const t of parsed) scheduleTickUpdate(t as TickMsg);
          return;
        }

        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.type === "snapshot" &&
          Array.isArray(parsed.data)
        ) {
          const ticks = parsed.data as TickMsg[];
          const assets = ticks.map(tickToAsset);
          for (const t of ticks) {
            const tid = pendingTimersRef.current.get(t.symbol);
            if (tid !== undefined) {
              clearTimeout(tid);
              pendingTimersRef.current.delete(t.symbol);
              pendingTicksRef.current.delete(t.symbol);
            }
            const fTid = flashClearTimersRef.current.get(t.symbol);
            if (fTid !== undefined) {
              clearTimeout(fTid);
              flashClearTimersRef.current.delete(t.symbol);
            }
          }
          setAssets(assets);
          return;
        }

        if (parsed && typeof parsed === "object" && parsed.symbol) {
          scheduleTickUpdate(parsed as TickMsg);
          return;
        }
      } catch (err: any) {
        setError(String(err?.message ?? err));
      }
    };

    ws.onerror = () => {
      setError("WebSocket error");
    };

    ws.onclose = (ev) => {
      setConnected(false);
      if (ev && ev.code !== 1000 && ev.code !== 1001) {
        setError(`WebSocket closed (code=${ev.code})`);
      } else {
        setError(null);
      }
      wsRef.current = null;
    };
  }, [url, setAssets, setConnected, setError, updateAsset, tickToAsset]);

  // open socket on mount
  useEffect(() => {
    connect();

    return () => {
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;

      for (const tid of pendingTimersRef.current.values()) clearTimeout(tid);
      pendingTimersRef.current.clear();
      pendingTicksRef.current.clear();

      for (const tid of flashClearTimersRef.current.values()) clearTimeout(tid);
      flashClearTimersRef.current.clear();
    };
  }, []);

  return {
    wsRef,
    reconnect: connect,
    getConnected: () => useWsStore.getState().connected,
  } as const;
}

export default useWsTicker;
