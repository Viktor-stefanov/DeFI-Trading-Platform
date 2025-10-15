import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import {
  PORT,
  WS_PATH,
  TICK_INTERVAL_MS,
  WS_BROADCAST_FLUSH_MS,
} from "./config";
import ordersRoute from "./routes/orders";
import { assetsList } from "./state/init";
import {
  addWsClient,
  removeWsClient,
  broadcastTicks,
  updateAssetTick,
  getAsset,
  getAssetsSnapshotForWs,
} from "./state/store";
import { tokenIsValid } from "./utils/validators";

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // narrow CORS for dev frontend
app.use(express.json());

// HTTP routes
app.use("/", ordersRoute);
app.get("/health", (_, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() })
);

const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

let wsClientCounter = 1;

/**
 * Handle upgraded WebSocket connection.
 * Performs a simple auth check using the token query string sent during the upgrade.
 */
wss.on("connection", (socket, req) => {
  const clientId = `c_${Date.now()}_${wsClientCounter++}`;
  const authToken = (req as any).authToken;

  console.log(`[WS] connection from clientId=${clientId}, token=${authToken}`);

  // Register client
  try {
    addWsClient(clientId, socket as any, { authToken });
    console.log(`[WS] added client ${clientId}`);
  } catch (err) {
    console.error(`[WS] addWsClient failed:`, err);
    try {
      socket.close(1011, "add client failed");
    } catch {}
    return;
  }

  const snapshot = getAssetsSnapshotForWs();
  console.log(
    `[WS] sending snapshot to ${clientId}, length=${snapshot.length}`
  );
  const payload = JSON.stringify({ type: "snapshot", data: snapshot });

  socket.send(payload, (err) => {
    if (err) {
      console.error(`[WS] send snapshot error:`, err);
      socket.terminate();
      removeWsClient(clientId);
    }
  });

  socket.on("message", (raw) => {
    try {
    } catch (err) {
      console.error(`[WS] message handler error:`, err);
    }
  });

  socket.on("error", (err) => {
    console.error(`[WS] socket error:`, err);
  });

  socket.on("close", (code, reason) => {
    console.log(
      `[WS] socket closed: code=${code} reason=${reason?.toString()}`
    );
    removeWsClient(clientId);
  });
});

wss.on("headers", (headers, req) => {
  console.log("WS headers:", headers);
});

/**
 * HTTP upgrade handling for /ws/ticker
 * We check Authorization header during HTTP -> WS upgrade and reject if invalid.
 */
server.on("upgrade", (req, socket, head) => {
  console.log("Origin header:", req.headers.origin);
  console.log("upgrade request url:", req.url);
  const host = req.headers.host || "localhost";
  const parsed = new URL(req.url ?? "/", `http://${host}`);
  console.log("parsed pathname:", parsed.pathname);

  const pathname = parsed.pathname.replace(/\/+$/, "");
  if (pathname !== WS_PATH.replace(/\/+$/, "")) {
    console.log("destroying socket: path mismatch");
    socket.destroy();
    return;
  }

  const tokenFromQuery = parsed.searchParams.get("token");
  console.log("token from query:", tokenFromQuery);
  if (!tokenIsValid(tokenFromQuery)) {
    console.log("destroying socket: invalid token");
    try {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    } catch {}
    socket.destroy();
    return;
  }

  (req as any).authToken = tokenFromQuery;

  console.log("calling handleUpgrade");
  wss.handleUpgrade(req, socket as any, head, (ws) => {
    console.log("emit connection");
    wss.emit("connection", ws, req);
  });
});

/**
 * Weighted selection helper
 * Builds a temporary array of symbols repeated by tickWeight and picks k unique samples.
 */
function pickWeightedSymbols(k = 3): string[] {
  const weighted: string[] = [];
  for (const a of assetsList) {
    const w = Math.max(1, Math.floor(a.tickWeight ?? 1));
    for (let i = 0; i < w; i++) weighted.push(a.symbol);
  }
  const picked = new Set<string>();
  const tries = Math.min(k * 5, weighted.length);
  for (let i = 0; i < tries && picked.size < k; i++) {
    const s = weighted[Math.floor(Math.random() * weighted.length)];
    picked.add(s);
  }

  return Array.from(picked);
}

/**
 * Perform a small random-walk step on chosen asset symbol and apply update via store.
 */
function simulateTickForSymbol(symbol: string) {
  const asset = getAsset(symbol);
  if (!asset) return null;

  const vol = asset.volatility ?? 0.002;
  const oldPrice = asset.price;
  const deltaPct = (Math.random() - 0.5) * 2 * vol;
  const newPrice = Math.max(0.00000001, oldPrice * (1 + deltaPct));
  const ts = new Date().toISOString();
  updateAssetTick(symbol, {
    price: newPrice,
    volume: Math.round(Math.random() * 1000),
    ts,
  });
  return { symbol, price: newPrice, ts };
}

/**
 * Internal buffer of pending ticks to broadcast (batched every WS_BROADCAST_FLUSH_MS).
 * This is just generating ticks the yare being broadcast later.
 */
let pendingTicks: any[] = [];

setInterval(() => {
  const symbols = pickWeightedSymbols(
    Math.max(1, Math.floor(assetsList.length / 4))
  );
  for (const s of symbols) {
    const t = simulateTickForSymbol(s);
    if (t) {
      const asset = getAsset(s)!;
      const tick = {
        type: "tick",
        symbol: asset.symbol,
        price: asset.price,
        volume: asset.volume24h ?? undefined,
        open24h: asset.open24h ?? undefined,
        change24hPct: asset.change24h ?? undefined,
        high24h: asset.high24h ?? undefined,
        low24h: asset.low24h ?? undefined,
        liquidityDepth: asset.liquidityDepth,
        pool: asset.pool
          ? {
              reserveBase: asset.pool.reserveBase,
              reserveToken: asset.pool.reserveToken,
              feeRate: asset.pool.feeRate,
            }
          : undefined,
        ts: t.ts,
      };
      pendingTicks.push(tick);
    }
  }
}, TICK_INTERVAL_MS);

/**
 * Periodically flush pendingTicks to connected clients.
 */
setInterval(() => {
  if (pendingTicks.length === 0) return;
  // coalesce by symbol - keep only latest tick per symbol
  const latestBySymbol: Record<string, any> = {};
  for (const t of pendingTicks) latestBySymbol[t.symbol] = t;
  const toSend = Object.values(latestBySymbol);
  pendingTicks = [];
  broadcastTicks(toSend);
}, WS_BROADCAST_FLUSH_MS);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`WebSocket ticker path ws://localhost:${PORT}${WS_PATH}`);
});
