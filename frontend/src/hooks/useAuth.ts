import { useCallback } from "react";
import client from "../lib/apiClient";

type Credentials = { email: string; password: string; fullName?: string };
type AuthResult = { success: boolean; message?: string };

const dispatchSessionEvent = (authenticated: boolean, user: unknown = null) => {
  try {
    window.dispatchEvent(
      new CustomEvent("auth:session-changed", {
        detail: { authenticated, user: authenticated ? (user ?? null) : null },
      })
    );
  } catch {
    /* ignore */
  }
};

const confirmSession = async (): Promise<AuthResult> => {
  try {
    const meResp = await client.get("/api/auth/me");
    const meData = meResp.data ?? {};
    if (meData.authenticated) {
      dispatchSessionEvent(true, meData.user ?? null);
      return { success: true };
    }

    dispatchSessionEvent(false);
    const message =
      typeof meData.message === "string"
        ? meData.message
        : "Session not established";
    return { success: false, message };
  } catch {
    dispatchSessionEvent(false);
    return { success: false, message: "Session check failed" };
  }
};

export default function useAuth() {
  const login = useCallback(async (creds: Credentials): Promise<AuthResult> => {
    try {
      const resp = await client.post("/api/auth/login", creds);
      const data = resp.data ?? {};
      const session = await confirmSession();
      if (session.success) return session;

      return {
        success: false,
        message:
          session.message ??
          (typeof data.message === "string" ? data.message : "Login failed"),
      };
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
      try {
        const resp = await client.post("/api/auth/register", creds);
        const data = resp.data ?? {};
        const session = await confirmSession();
        if (session.success) return session;

        return {
          success: false,
          message:
            session.message ??
            (typeof data.message === "string"
              ? data.message
              : "Registration failed"),
        };
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
    try {
      const win = window as unknown as {
        ethereum?: { request: (opts: unknown) => Promise<unknown> };
      };
      const provider = win.ethereum;
      if (!provider) {
        return { success: false, message: "MetaMask not installed" };
      }

      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = (accounts && accounts[0])?.toLowerCase();
      if (!address)
        return { success: false, message: "No wallet accounts available" };

      // request nonce
      const nonceResp = await client.get("/api/auth/nonce", {
        params: { address },
      });
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
      const verifyResp = await client.post("/api/auth/verify", {
        address,
        signature,
      });
      const verifyJson = verifyResp.data ?? {};
      const session = await confirmSession();
      if (session.success) return session;

      return {
        success: false,
        message:
          session.message ??
          (typeof verifyJson?.message === "string"
            ? verifyJson.message
            : "Session not established"),
      };
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
