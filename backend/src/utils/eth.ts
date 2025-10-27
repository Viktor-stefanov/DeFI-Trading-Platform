import { getAddress, verifyMessage } from "ethers";

export function normalizeAddress(address: string): string {
  try {
    return getAddress(address);
  } catch (err) {
    return address.toLowerCase();
  }
}

/**
 * Verifies that a signature was produced by the private key that controls `address`.
 * Returns the recovered address (checksummed) or null if verification fails.
 */
export function verifySignature(
  message: string,
  signature: string
): string | null {
  try {
    const recovered = verifyMessage(message, signature);
    return getAddress(recovered);
  } catch (err) {
    return null;
  }
}
