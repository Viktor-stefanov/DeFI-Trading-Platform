import crypto from "crypto";

type NonceEntry = { value: string; expiresAt: number };

const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS || 5 * 60 * 1000); // 5 minutes default

const store = new Map<string, NonceEntry>();

/**
 * Create and store a new nonce for the given address.
 * The nonce is a random 16-byte hex string and is stored with a TTL.
 *
 * @param address - Ethereum address for which to create the nonce
 * @returns the generated nonce string
 */
export function createNonce(address: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + NONCE_TTL_MS;
  store.set(address.toLowerCase(), { value: nonce, expiresAt });
  return nonce;
}

/**
 * Retrieve the current valid nonce for an address, or null if none exists
 * or it has expired. If expired, the nonce is removed from the store.
 *
 * @param address - Ethereum address whose nonce to retrieve
 * @returns the nonce string or null when not present/expired
 */
export function getNonce(address: string): string | null {
  const entry = store.get(address.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(address.toLowerCase());
    return null;
  }
  return entry.value;
}

/**
 * Invalidate (delete) any stored nonce for the provided address.
 * Useful after a successful authentication to prevent replay attacks.
 *
 * @param address - Ethereum address whose nonce should be removed
 */
export function invalidateNonce(address: string): void {
  store.delete(address.toLowerCase());
}

// For debug / admin use
/**
 * Clear all stored nonces. Intended for testing or administrative use only.
 * Not exported for public API in production scenarios.
 */
export function _clearAllNonces(): void {
  store.clear();
}
