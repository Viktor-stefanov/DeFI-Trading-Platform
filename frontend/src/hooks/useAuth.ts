import { useCallback } from "react";
import client, { setAuthToken } from "../lib/apiClient";

type Credentials = { email: string; password: string; name?: string };
type AuthResult = { success: boolean; message?: string; token?: string };

export default function useAuth() {
  const login = useCallback(async (creds: Credentials): Promise<AuthResult> => {
    // Placeholder: replace endpoint with your auth API
    try {
      const resp = await client.post("/auth/login", creds);
      const data = resp.data ?? {};
      if (data.token) setAuthToken(data.token);
      return { success: true, token: data.token };
    } catch (err: unknown) {
      console.error("login error", err);
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: unknown }).message
          : undefined;
      return {
        success: false,
        message: typeof msg === "string" ? msg : "Login failed",
      };
    }
  }, []);

  const register = useCallback(
    async (creds: Credentials): Promise<AuthResult> => {
      // Placeholder: replace endpoint with your auth API
      try {
        const resp = await client.post("/auth/register", creds);
        const data = resp.data ?? {};
        if (data.token) setAuthToken(data.token);
        return { success: true, token: data.token };
      } catch (err: unknown) {
        console.error("register error", err);
        const msg =
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: unknown }).message
            : undefined;
        return {
          success: false,
          message: typeof msg === "string" ? msg : "Registration failed",
        };
      }
    },
    []
  );

  const walletLogin = useCallback(async (): Promise<AuthResult> => {
    // Frontend MetaMask flow (uses axios client for backend requests)
    try {
      const win = window as unknown as {
        ethereum?: { request: (opts: unknown) => Promise<unknown> };
      };
      const provider = win.ethereum;
      if (!provider)
        return { success: false, message: "MetaMask not installed" };

      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = (accounts && accounts[0])?.toLowerCase();
      if (!address)
        return { success: false, message: "No wallet accounts available" };

      // request nonce/message from backend
      // endpoint: http://localhost:8000/api/auth/nonce
      const nonceResp = await client.get(
        "http://localhost:8000/api/auth/nonce",
        {
          params: { address },
        }
      );
      const nonceJson = nonceResp.data ?? {};
      const message: string = nonceJson?.message ?? nonceJson?.nonce ?? "";
      if (!message)
        return { success: false, message: "Invalid nonce response" };

      // wallet signs the message
      const signature = (await provider.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;

      // send signature to backend to verify
      // endpoint: http://localhost:8000/api/auth/verify
      const verifyResp = await client.post(
        "http://localhost:8000/api/auth/verify",
        {
          address,
          signature,
        }
      );
      const verifyJson = verifyResp.data ?? {};
      const token = verifyJson?.token;
      if (!token)
        return {
          success: false,
          message: verifyJson?.message ?? "No token returned",
        };

      // Do NOT persist token to localStorage here. Caller / app decide persistence.
      // Set token on the axios client (in-memory) so subsequent requests use it.
      setAuthToken(token);

      return { success: true, token };
    } catch (err: unknown) {
      console.error("walletLogin error", err);
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: unknown }).message
          : undefined;
      return {
        success: false,
        message: typeof msg === "string" ? msg : "Wallet login failed",
      };
    }
  }, []);

  return { login, register, walletLogin } as const;
}
