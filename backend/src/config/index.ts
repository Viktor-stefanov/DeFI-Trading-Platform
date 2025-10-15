export const PORT = Number(process.env.PORT ?? 4000);
export const BEARER_TOKEN = process.env.BEARER_TOKEN ?? "demo";
export const WS_PATH = "/ws/ticker";
export const TICK_INTERVAL_MS = 100; // internal simulation tick loop cadence
export const WS_BROADCAST_FLUSH_MS = 150; // client-facing batching cadence
