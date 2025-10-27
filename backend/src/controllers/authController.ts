import { Request, Response } from "express";
import {
  createNonce,
  getNonce,
  invalidateNonce,
} from "../services/nonceService";
import { verifySignature } from "../utils/eth";
import { signJwt } from "../utils/jwt";

function makeMessage(nonce: string): string {
  // Standard human-readable prompt for signing. Keep stable so verification works.
  return `Sign this message to authenticate with the app. Nonce: ${nonce}`;
}

export async function getNonceHandler(req: Request, res: Response) {
  const address = (req.query.address as string | undefined)?.trim();
  if (!address)
    return res.status(400).json({ error: "address query param required" });

  const nonce = createNonce(address);
  const message = makeMessage(nonce);
  return res.json({ nonce, message });
}

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
