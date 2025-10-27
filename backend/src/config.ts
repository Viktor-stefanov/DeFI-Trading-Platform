export const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";
export const JWT_EXPIRES = process.env.JWT_EXPIRES || "1h";
export const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS || 5 * 60 * 1000);
