import crypto from "crypto";

type NonceEntry = { value: string; expiresAt: number };

const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS || 5 * 60 * 1000); // 5 minutes default

const store = new Map<string, NonceEntry>();

export function createNonce(address: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + NONCE_TTL_MS;
  store.set(address.toLowerCase(), { value: nonce, expiresAt });
  return nonce;
}

export function getNonce(address: string): string | null {
  const entry = store.get(address.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(address.toLowerCase());
    return null;
  }
  return entry.value;
}

export function invalidateNonce(address: string): void {
  store.delete(address.toLowerCase());
}

// For debug / admin use
export function _clearAllNonces(): void {
  store.clear();
}
