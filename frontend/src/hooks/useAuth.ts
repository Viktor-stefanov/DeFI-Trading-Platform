import { useCallback } from "react";
import client from "../lib/apiClient";

const mask = (t?: string | null) => {
  if (!t) return null;
  if (t.length <= 16) return `${t.slice(0, 4)}...${t.slice(-4)}`;
  return `${t.slice(0, 8)}...${t.slice(-8)}`;
};

type Credentials = { email: string; password: string; fullName?: string };
type AuthResult = { success: boolean; message?: string };

const dispatchSessionEvent = (authenticated: boolean, user: unknown = null) => {
  try {
    window.dispatchEvent(
      new CustomEvent("auth:session-changed", {
        detail: { authenticated, user: authenticated ? (user ?? null) : null },
      })
    );
  } catch (e) {
    console.debug("useAuth.dispatchSessionEvent failed", e);
  }
};

const confirmSession = async (): Promise<AuthResult> => {
  try {
    const meResp = await client.get("/api/auth/me");
    console.debug("useAuth.confirmSession /api/auth/me response", {
      status: meResp.status,
      data: meResp.data,
    });
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
  } catch (error) {
    console.debug("useAuth.confirmSession error", error);
    dispatchSessionEvent(false);
    return { success: false, message: "Session check failed" };
  }
};

export default function useAuth() {
  const login = useCallback(async (creds: Credentials): Promise<AuthResult> => {
    console.debug("useAuth.login start", { creds });
    try {
      const resp = await client.post("/api/auth/login", creds);
      console.debug("useAuth.login response", {
        status: resp.status,
        data: resp.data,
      });
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
      console.debug("useAuth.register start", { creds });
      try {
        const resp = await client.post("/api/auth/register", creds);
        console.debug("useAuth.register response", {
          status: resp.status,
          data: resp.data,
        });
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
    console.debug("useAuth.walletLogin start");
    try {
      const win = window as unknown as {
        ethereum?: { request: (opts: unknown) => Promise<unknown> };
      };
      const provider = win.ethereum;
      if (!provider) {
        console.debug("useAuth.walletLogin - no provider");
        return { success: false, message: "MetaMask not installed" };
      }

      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = (accounts && accounts[0])?.toLowerCase();
      console.debug("useAuth.walletLogin accounts", { accounts, address });
      if (!address)
        return { success: false, message: "No wallet accounts available" };

      // request nonce
      const nonceResp = await client.get("/api/auth/nonce", {
        params: { address },
      });
      console.debug("useAuth.walletLogin nonce response", {
        status: nonceResp.status,
        data: nonceResp.data,
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
      console.debug("useAuth.walletLogin signature received", {
        signature: mask(signature),
      });

      // send signature to backend to verify
      const verifyResp = await client.post("/api/auth/verify", {
        address,
        signature,
      });
      console.debug("useAuth.walletLogin verify response", {
        status: verifyResp.status,
        data: verifyResp.data,
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
