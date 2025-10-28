export const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";
export const JWT_EXPIRES = process.env.JWT_EXPIRES || "1h";
export const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS || 5 * 60 * 1000);
export const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "session";
// cookie max age in ms (match JWT_EXPIRES if numeric). Default 1 hour
export const JWT_COOKIE_MAX_AGE = Number(
  process.env.JWT_COOKIE_MAX_AGE_MS || 60 * 60 * 1000
);
