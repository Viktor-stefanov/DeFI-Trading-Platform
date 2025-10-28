import { getAddress, verifyMessage } from "ethers";

/**
 * Normalize an Ethereum address into its canonical (EIP-55 checksummed) form.
 * If normalization fails, the lowercased input is returned as a fallback.
 *
 * @param address - The address string to normalize
 * @returns checksummed address or lowercased input on failure
 */
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
 *
 * @param message - The original plaintext message that was signed
 * @param signature - The signature returned by the wallet (hex string)
 * @returns the recovered checksummed address, or null on failure
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
