import type {
  Asset,
  HistoryEntry,
  TickMessage,
  Order,
  StoreRuntime,
} from "../types/models";
import { assetsMap, assetsList } from "./init";

const HISTORY_MAX = 600; // how many entries to keep in the circular buffer
const ORDER_LIST_MAX = 10000; // how many orders can be stored at once in-memory
const WS_OPEN_STATE = 1;

/**
 * Runtime in-memory store.
 *
 * - assetsMap is imported from init.ts and used as the canonical in-memory asset registry.
 * - ordersList is the in-memory append-only order store (newest appended at the end).
 * - wsClients tracks connected websocket clients and light metadata.
 */
export const ordersList: Order[] = [];
type WsSocketLike = {
  send: (data: string) => void;
  readyState?: number;
  close?: () => void;
};

interface WsClientMeta {
  socket: WsSocketLike;
  connectedAt: string;
  lastPing?: string;
  auth?: { token?: string; valid?: boolean };
  subscriptions?: Set<string>;
}

const wsClients: Map<string, WsClientMeta> = new Map();

/**
 * Returns a minimal tick payload array suitable for WS broadcasting.
 * Each entry conforms to TickMessage (type: 'tick', symbol, price, ts, optional fields).
 */
export function getAssetsSnapshotForWs(): TickMessage[] {
  const ticks: TickMessage[] = [];
  for (const asset of assetsList) {
    const open24h =
      asset.open24h ??
      (asset.history && asset.history.length
        ? asset.history[0].price
        : asset.basePrice);
    const change24hPct = open24h
      ? ((asset.price - open24h) / open24h) * 100
      : 0;
    const tick: TickMessage = {
      type: "tick",
      symbol: asset.symbol,
      price: asset.price,
      volume: asset.volume24h ?? undefined,
      open24h: open24h,
      change24hPct: Number(change24hPct.toFixed(6)),
      high24h: asset.high24h,
      low24h: asset.low24h,
      liquidityDepth: asset.liquidityDepth,
      pool: asset.pool
        ? {
            reserveBase: asset.pool.reserveBase,
            reserveToken: asset.pool.reserveToken,
            feeRate: asset.pool.feeRate,
          }
        : undefined,
      ts: new Date().toISOString(),
    };
    ticks.push(tick);
  }
  return ticks;
}

/**
 * Get a single asset by symbol.
 */
export function getAsset(symbol: string): Asset | undefined {
  return assetsMap.get(symbol);
}

/**
 * Generic patcher for an asset. Applies shallow merge of `patch` onto the asset.
 */
export function setAssetPatch(
  symbol: string,
  patch: Partial<Asset>
): Asset | undefined {
  const asset = assetsMap.get(symbol);
  if (!asset) return undefined;
  const patched: Asset = {
    ...asset,
    ...patch,
    lastUpdated: new Date().toISOString(),
  };
  assetsMap.set(symbol, patched);
  // keep assetsList in sync
  const idx = assetsList.findIndex((a) => a.symbol === symbol);
  if (idx >= 0) assetsList[idx] = patched;
  return patched;
}

/**
 * Pushes a new history entry into the asset's circular buffer, capping at HISTORY_MAX.
 */
function pushHistoryEntry(asset: Asset, entry: HistoryEntry) {
  if (!asset.history) asset.history = [];
  asset.history.push(entry);
  if (asset.history.length > HISTORY_MAX) {
    asset.history.splice(0, asset.history.length - HISTORY_MAX);
  }
}

/**
 * Recompute derived fields (open24h, high24h, low24h, volume24h, change24h)
 * based on the asset.history buffer if present.
 */
function recomputeDerivedFromHistory(asset: Asset) {
  if (!asset.history || asset.history.length === 0) return;

  const prices = asset.history.map((h) => h.price);
  const volumes = asset.history.map((h) => h.volume ?? 0);

  const open24h = asset.history[0].price;
  const high24h = Math.max(...prices);
  const low24h = Math.min(...prices);
  const volume24h = volumes.reduce((s, v) => s + v, 0);
  const change24h = open24h ? ((asset.price - open24h) / open24h) * 100 : 0;

  asset.open24h = open24h;
  asset.high24h = high24h;
  asset.low24h = low24h;
  asset.volume24h = volume24h;
  asset.change24h = Number(change24h.toFixed(6));
}

/**
 * Apply a tick update (partialTick may contain price, volume, ts, pool snapshot).
 * This updates the asset price, lastUpdated, pushes history entry and recomputes derived fields.
 */
export function updateAssetTick(
  symbol: string,
  partialTick: {
    price?: number;
    volume?: number;
    ts?: string;
    pool?: Partial<Asset["pool"]>;
  }
) {
  const asset = assetsMap.get(symbol);
  if (!asset) return;

  const now = partialTick.ts ?? new Date().toISOString();
  if (partialTick.price !== undefined) asset.price = partialTick.price;
  if (partialTick.volume !== undefined) {
    asset.volume24h = (asset.volume24h ?? 0) + partialTick.volume;
  }
  asset.lastUpdated = now;

  pushHistoryEntry(asset, {
    ts: now,
    price: asset.price,
    volume: partialTick.volume,
  });

  if (partialTick.pool && asset.pool) {
    asset.pool = { ...asset.pool, ...partialTick.pool };
  }

  recomputeDerivedFromHistory(asset);

  // reflect changes into assetsMap and assetsList
  assetsMap.set(symbol, asset);
  const idx = assetsList.findIndex((a) => a.symbol === symbol);
  if (idx >= 0) assetsList[idx] = asset;
}

/**
 * Add an optimistic order (client-side generated clientId expected).
 * Order should be shaped according to Order type but may be missing server fields (id, ts, price).
 */
export function addOptimisticOrder(order: Order) {
  ordersList.push(order);
  pruneOldOrders(ORDER_LIST_MAX);
}

/**
 * Replace optimistic order matched by clientId with server-confirmed order.
 * If not found by clientId, push serverOrder to the list.
 */
export function replaceOrderByClientId(clientId: string, serverOrder: Order) {
  const idx = ordersList.findIndex((o) => o.clientId === clientId);
  if (idx >= 0) {
    ordersList[idx] = serverOrder;
  } else {
    ordersList.push(serverOrder);
  }
  pruneOldOrders(ORDER_LIST_MAX);
}

/**
 * Mark a pending/optimistic order as error/rejected by clientId.
 */
export function markOrderError(clientId: string, reason: string) {
  const idx = ordersList.findIndex((o) => o.clientId === clientId);
  if (idx >= 0) {
    ordersList[idx] = {
      ...ordersList[idx],
      status: "rejected",
      notes: reason,
      ts: new Date().toISOString(),
    };
  }
}

/**
 * Get orders (supports simple limit and optional status filter).
 */
export function getOrders(opts?: {
  limit?: number;
  status?: Order["status"];
}): Order[] {
  let list = ordersList.slice();
  if (opts?.status) list = list.filter((o) => o.status === opts.status);
  if (opts?.limit) list = list.slice(-opts.limit);
  return list;
}

/**
 * Prune orders list to maxEntries (keeps newest).
 */
export function pruneOldOrders(maxEntries: number) {
  if (ordersList.length > maxEntries) {
    const removeCount = ordersList.length - maxEntries;
    ordersList.splice(0, removeCount);
  }
}

/**
 * Register a new WS client.
 * - clientId: string chosen by server (or provided by client)
 * - socket: object with a send(data: string) method
 * - meta: optional auth and subscription info
 */
export function addWsClient(
  clientId: string,
  socket: WsSocketLike,
  meta?: { authToken?: string; subscriptions?: string[] }
) {
  const now = new Date().toISOString();
  const entry: WsClientMeta = {
    socket,
    connectedAt: now,
    lastPing: now,
    auth: { token: meta?.authToken, valid: !!meta?.authToken },
    subscriptions: new Set(meta?.subscriptions ?? []),
  };
  wsClients.set(clientId, entry);
}

/**
 * Remove/unregister WS client (cleanup).
 */
export function removeWsClient(clientId: string) {
  const client = wsClients.get(clientId);
  if (!client) return;
  if (client.socket && typeof client.socket.close === "function") {
    client.socket.close();
  }

  wsClients.delete(clientId);
}

/**
 * Send a message to a single client (stringifies JSON).
 */
export function sendToClient(clientId: string, msg: unknown) {
  const client = wsClients.get(clientId);
  if (!client) return false;
  try {
    if (
      client.socket.readyState === undefined ||
      client.socket.readyState === WS_OPEN_STATE
    ) {
      client.socket.send(JSON.stringify(msg));
      client.lastPing = new Date().toISOString();
      return true;
    } else {
      // not open, cleanup
      removeWsClient(clientId);
      return false;
    }
  } catch {
    removeWsClient(clientId);
    return false;
  }
}

/**
 * Broadcast batched ticks to connected clients.
 * If a client has subscriptions, only send ticks for subscribed symbols (if ticks is an array).
 */
export function broadcastTicks(ticks: TickMessage[] | TickMessage) {
  const payload = Array.isArray(ticks) ? ticks : [ticks];

  for (const [clientId, meta] of wsClients.entries()) {
    // quick ready-state check
    if (
      meta.socket.readyState !== undefined &&
      meta.socket.readyState !== WS_OPEN_STATE
    ) {
      removeWsClient(clientId);
      continue;
    }

    let toSend = payload;
    if (meta.subscriptions && meta.subscriptions.size > 0) {
      // filter ticks by subscription set
      toSend = payload.filter((t) => meta.subscriptions!.has(t.symbol));
      if (toSend.length === 0) continue; // nothing relevant for this client
    }

    try {
      meta.socket.send(JSON.stringify(toSend));
      meta.lastPing = new Date().toISOString();
    } catch {
      removeWsClient(clientId);
    }
  }
}

export function getAssetList(): Asset[] {
  return assetsList.slice(); // return a shallow copy for read-only access
}

export function getWsClientCount(): number {
  return wsClients.size;
}

/**
 * Export runtime container typed shape if needed elsewhere.
 */
export const runtimeStore: StoreRuntime = {
  assetsMap,
  ordersList,
};
