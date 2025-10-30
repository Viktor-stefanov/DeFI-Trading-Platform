import { useEffect, useMemo, useRef, useState } from "react";

export type StreamStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "closed"
  | "error"
  | "unconfigured";

export type TickerRow = {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  volume: number;
  quoteVolume: number;
  weightedAvgPrice: number;
  bestBid: number;
  bestAsk: number;
  tradeCount: number;
  eventTime: number | null;
};

const DEFAULT_WS_URL = import.meta.env.VITE_TICKER_WS_URL ?? "";

const getRandomFlushInterval = () => Math.floor(500 + Math.random() * 500);

type RawTicker = {
  s?: string;
  c?: string;
  p?: string;
  P?: string;
  h?: string;
  l?: string;
  o?: string;
  v?: string;
  q?: string;
  w?: string;
  b?: string;
  a?: string;
  n?: number;
  E?: number;
};

const toNumber = (value?: string | number | null) => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTicker = (raw: RawTicker): TickerRow | null => {
  const symbol = raw.s;
  if (!symbol) return null;

  return {
    symbol,
    lastPrice: toNumber(raw.c),
    priceChange: toNumber(raw.p),
    priceChangePercent: toNumber(raw.P),
    highPrice: toNumber(raw.h),
    lowPrice: toNumber(raw.l),
    openPrice: toNumber(raw.o),
    volume: toNumber(raw.v),
    quoteVolume: toNumber(raw.q),
    weightedAvgPrice: toNumber(raw.w),
    bestBid: toNumber(raw.b),
    bestAsk: toNumber(raw.a),
    tradeCount: typeof raw.n === "number" ? raw.n : 0,
    eventTime: typeof raw.E === "number" ? raw.E : null,
  };
};

const extractPayloads = (payload: unknown): RawTicker[] => {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => extractPayloads(entry));
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return [];
    const candidate =
      trimmed.startsWith("{") || trimmed.startsWith("[")
        ? trimmed
        : `[${trimmed}]`;
    try {
      const parsed = JSON.parse(candidate);
      return extractPayloads(parsed);
    } catch {
      return [];
    }
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (obj.data) return extractPayloads(obj.data);
    if (obj.stream) {
      const { data } = obj as { data?: unknown };
      if (data) return extractPayloads(data);
    }
    return [obj as RawTicker];
  }

  return [];
};

const useTickerStream = (url: string = DEFAULT_WS_URL) => {
  const [status, setStatus] = useState<StreamStatus>(() =>
    url ? "idle" : "unconfigured"
  );
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [tickers, setTickers] = useState<Record<string, TickerRow>>({});
  const [attempt, setAttempt] = useState(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Record<string, TickerRow>>({});
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const clearFlushTimer = () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };

    if (!url) {
      setStatus("unconfigured");
      setError(
        "Ticker WebSocket URL missing. Set VITE_TICKER_WS_URL to enable the feed."
      );
      clearFlushTimer();
      pendingUpdatesRef.current = {};
      setTickers({});
      setLastUpdated(null);
      return undefined;
    }

    if (!("WebSocket" in window)) {
      setStatus("error");
      setError("WebSocket is not supported in this environment.");
      clearFlushTimer();
      pendingUpdatesRef.current = {};
      setTickers({});
      setLastUpdated(null);
      return undefined;
    }

    setStatus("connecting");
    setError(null);
    setTickers({});
    pendingUpdatesRef.current = {};
    clearFlushTimer();
    setLastUpdated(null);
    const ws = new WebSocket(url);
    let active = true;

    const flushPendingUpdates = () => {
      flushTimerRef.current = null;
      const pending = pendingUpdatesRef.current;
      const symbols = Object.keys(pending);
      if (!symbols.length) return;

      pendingUpdatesRef.current = {};
      setTickers((prev) => {
        const next = { ...prev };
        for (const symbol of symbols) {
          next[symbol] = pending[symbol];
        }
        return next;
      });
      setLastUpdated(Date.now());
    };

    const scheduleFlush = () => {
      if (flushTimerRef.current !== null) return;
      flushTimerRef.current = window.setTimeout(
        flushPendingUpdates,
        getRandomFlushInterval()
      );
    };

    const scheduleReconnect = () => {
      if (!active) return;
      if (reconnectTimerRef.current !== null) return;
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        setAttempt((prev) => prev + 1);
      }, 2500);
    };

    ws.onopen = () => {
      if (!active) return;
      setStatus("connected");
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!active) return;
      const updates = extractPayloads(event.data);
      if (!updates.length) return;

      let hasNormalized = false;
      for (const raw of updates) {
        const normalized = normalizeTicker(raw);
        if (normalized) {
          pendingUpdatesRef.current[normalized.symbol] = normalized;
          hasNormalized = true;
        }
      }

      if (hasNormalized) {
        scheduleFlush();
      }
    };

    ws.onerror = (event) => {
      if (!active) return;
      console.error("Ticker stream error", event);
      setStatus("error");
      setError("Real-time market feed errored. Check the network console.");
      flushPendingUpdates();
      scheduleReconnect();
    };

    ws.onclose = () => {
      if (!active) return;
      setStatus((current) => (current === "error" ? current : "closed"));
      flushPendingUpdates();
      scheduleReconnect();
    };

    return () => {
      active = false;
      flushPendingUpdates();
      clearFlushTimer();
      pendingUpdatesRef.current = {};
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      ws.close();
    };
  }, [url, attempt]);

  const rows = useMemo(() => {
    return Object.values(tickers).sort((a, b) => b.quoteVolume - a.quoteVolume);
  }, [tickers]);

  return {
    status,
    error,
    rows,
    lastUpdated,
  };
};

export default useTickerStream;
