import { BEARER_TOKEN } from "../config";

/**
 * Validate that the authentication token is valid.
 * In this case only the constant defined in src/config/index.ts as BEARER_TOKEN is considered valid.
 */
export function tokenIsValid(token?: string | null): boolean {
  if (!token) return false;
  return token === BEARER_TOKEN;
}

/**
 * Validate the shape and values of the order request body.
 */
export function validateOrderBody(
  body: any
): { ok: true } | { ok: false; reason: string } {
  if (!body || typeof body !== "object")
    return { ok: false, reason: "Invalid body" };
  const { symbol, side, qty } = body;
  if (!symbol || typeof symbol !== "string")
    return { ok: false, reason: "Missing symbol" };
  if (side !== "buy" && side !== "sell")
    return { ok: false, reason: "Invalid side" };
  if (typeof qty !== "number" || Number.isNaN(qty) || qty <= 0)
    return { ok: false, reason: "Invalid qty" };
  return { ok: true };
}
