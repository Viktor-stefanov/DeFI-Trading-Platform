import jwt, { SignOptions, Secret } from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "1h";

/**
 * Sign a JWT for the given payload using the configured secret and expiry.
 *
 * @param payload - Object to include in the JWT payload (e.g. { address })
 * @returns signed JWT string
 */
export function signJwt(payload: object): string {
  const opts = { expiresIn: JWT_EXPIRES } as any;
  return jwt.sign(payload, JWT_SECRET as Secret, opts as SignOptions);
}

/**
 * Verify and decode a JWT token. Returns the decoded payload on success,
 * or null if verification fails.
 *
 * @typeParam T - Expected payload shape after verification
 * @param token - JWT string to verify
 * @returns decoded payload as T or null on failure
 */
export function verifyJwt<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (err: any) {
    // Don't log the token. Decode non-verified payload to aid debugging
    try {
      const decoded = jwt.decode(token) as any;
      const debugInfo = {
        userId: decoded?.userId ?? null,
        address: decoded?.address ?? null,
        email: decoded?.email ?? null,
        iat: decoded?.iat ?? null,
        exp: decoded?.exp ?? null,
      };
      logger.warn("[auth][jwt] verify failed; decoded payload fields", {
        payload: debugInfo,
        err,
      });
    } catch (decodeErr) {
      logger.error("[auth][jwt] verify failed and decode also failed", {
        verifyError: err,
        decodeError: decodeErr,
      });
    }
    return null;
  }
}
