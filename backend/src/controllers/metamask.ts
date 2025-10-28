import { Request, Response } from "express";
import {
  createNonce,
  getNonce,
  invalidateNonce,
} from "../services/nonceService";
import { verifySignature } from "../utils/eth";
import { signJwt } from "../utils/jwt";

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
  const { address, signature } = req.body as {
    address?: string;
    signature?: string;
  };
  if (!address || !signature)
    return res.status(400).json({ error: "address and signature required" });

  const nonce = getNonce(address);
  if (!nonce)
    return res
      .status(400)
      .json({ error: "no valid nonce for address (maybe expired)" });

  const message = makeMessage(nonce);
  const recovered = verifySignature(message, signature);
  if (!recovered)
    return res.status(400).json({ error: "signature verification failed" });

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ error: "signature does not match address" });
  }

  // OK — create session token
  const token = signJwt({ address: recovered });

  // Invalidate nonce so replay is not possible
  invalidateNonce(address);

  return res.json({ token });
}
