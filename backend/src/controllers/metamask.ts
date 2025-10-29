import { Request, Response } from "express";
import {
  createNonce,
  getNonce,
  invalidateNonce,
} from "../services/nonceService";
import { verifySignature } from "../utils/eth";
import { signJwt } from "../utils/jwt";
import { JWT_COOKIE_NAME, JWT_COOKIE_MAX_AGE } from "../config";
import logger from "../utils/logger";

/**
 * Build the human-readable message that the user will sign in MetaMask.
 * Keep this stable so the same message can be recreated for verification.
 *
 * @param nonce - one-time nonce to include in the message
 * @returns message string to be signed by the wallet
 */
function makeMessage(nonce: string): string {
  return `Sign this message to authenticate with the app. Nonce: ${nonce}`;
}

/**
 * GET /auth/nonce?address=0x...
 * Create and return a nonce and the message that the frontend should sign.
 */
export async function getNonceHandler(req: Request, res: Response) {
  const address = (req.query.address as string | undefined)?.trim();
  if (!address)
    return res.status(400).json({ error: "address query param required" });

  const nonce = createNonce(address);
  const message = makeMessage(nonce);
  return res.json({ nonce, message });
}

/**
 * POST /auth/verify
 * Verify that the provided signature was created by the given address signing
 * the server-provided nonce message. If valid, issue a JWT for the session.
 *
 * Expected body: { address: string, signature: string }
 */
export async function verifyHandler(req: Request, res: Response) {
  logger.debug("[auth][metamask] verifyHandler invoked");
  const { address, signature } = req.body as {
    address?: string;
    signature?: string;
  };
  if (!address || !signature) {
    logger.warn("[auth][metamask] verifyHandler missing fields", {
      hasAddress: Boolean(address),
      hasSignature: Boolean(signature),
    });
    return res.status(400).json({ error: "address and signature required" });
  }

  const nonce = getNonce(address);
  if (!nonce) {
    logger.warn(`[auth][metamask] no nonce for ${address}`);
    return res
      .status(400)
      .json({ error: "no valid nonce for address (maybe expired)" });
  }

  const message = makeMessage(nonce);
  const recovered = verifySignature(message, signature);
  if (!recovered) {
    logger.warn(
      `[auth][metamask] signature verification failed for ${address}`
    );
    return res.status(400).json({ error: "signature verification failed" });
  }

  logger.debug(`[auth][metamask] recovered=${recovered} expected=${address}`);
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    logger.warn(`[auth][metamask] signature does not match address ${address}`);
    return res.status(401).json({ error: "signature does not match address" });
  }

  // OK — create session token
  const token = signJwt({ address: recovered });

  // Invalidate nonce so replay is not possible
  invalidateNonce(address);

  // Set HttpOnly cookie
  res.cookie(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: JWT_COOKIE_MAX_AGE,
  });

  logger.info(`[auth][metamask] verifyHandler success address=${recovered}`);
  return res.json({ address: recovered });
}
