import { useCallback } from "react";
import client, { setAuthToken } from "../lib/apiClient";

const mask = (t?: string | null) => {
  if (!t) return null;
  if (t.length <= 16) return `${t.slice(0, 4)}...${t.slice(-4)}`;
  return `${t.slice(0, 8)}...${t.slice(-8)}`;
};

type Credentials = { email: string; password: string; fullName?: string };
type AuthResult = { success: boolean; message?: string; token?: string };

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
      if (data.token) {
        console.debug("useAuth.login received token", {
          token: mask(data.token),
        });
        setAuthToken(data.token);
        return { success: true, token: data.token };
      }

      // If backend uses HttpOnly cookie session, confirm via /api/auth/me and emit session event
      try {
        const meResp = await client.get("/api/auth/me");
        console.debug("useAuth.login /api/auth/me response", {
          status: meResp.status,
          data: meResp.data,
        });
        const meData = meResp.data ?? {};
        if (meData.authenticated) {
          try {
            console.debug("useAuth.login emitting auth:session-changed", {
              user: meData.user ?? null,
            });
            window.dispatchEvent(
              new CustomEvent("auth:session-changed", {
                detail: { authenticated: true, user: meData.user ?? null },
              })
            );
          } catch (e) {
            console.debug("useAuth.login dispatch event failed", e);
          }
          return { success: true };
        }
      } catch (e) {
        console.debug("useAuth.login /api/auth/me error", e);
      }

      return { success: !!data.token, token: data.token };
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
        if (data.token) {
          console.debug("useAuth.register received token", {
            token: mask(data.token),
          });
          setAuthToken(data.token);
          return { success: true, token: data.token };
        }

        try {
          const meResp = await client.get("/api/auth/me");
          console.debug("useAuth.register /api/auth/me response", {
            status: meResp.status,
            data: meResp.data,
          });
          const meData = meResp.data ?? {};
          if (meData.authenticated) {
            try {
              console.debug("useAuth.register emitting auth:session-changed", {
                user: meData.user ?? null,
              });
              window.dispatchEvent(
                new CustomEvent("auth:session-changed", {
                  detail: { authenticated: true, user: meData.user ?? null },
                })
              );
            } catch (e) {
              console.debug("useAuth.register dispatch event failed", e);
            }
            return { success: true };
          }
        } catch (e) {
          console.debug("useAuth.register /api/auth/me error", e);
        }

        return { success: !!data.token, token: data.token };
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
      const token = verifyJson?.token;
      if (token) {
        console.debug("useAuth.walletLogin received token", {
          token: mask(token),
        });
        setAuthToken(token);
        return { success: true, token };
      }

      // If server sets an HttpOnly cookie on verify, confirm via /api/auth/me and emit session event
      try {
        const meResp = await client.get("/api/auth/me");
        console.debug("useAuth.walletLogin /api/auth/me response", {
          status: meResp.status,
          data: meResp.data,
        });
        const meData = meResp.data ?? {};
        if (meData.authenticated) {
          try {
            console.debug("useAuth.walletLogin emitting auth:session-changed", {
              user: meData.user ?? null,
            });
            window.dispatchEvent(
              new CustomEvent("auth:session-changed", {
                detail: { authenticated: true, user: meData.user ?? null },
              })
            );
          } catch (e) {
            console.debug("useAuth.walletLogin dispatch event failed", e);
          }
          return { success: true };
        }
      } catch (e) {
        console.debug("useAuth.walletLogin /api/auth/me error", e);
      }

      return {
        success: false,
        message: verifyJson?.message ?? "No token returned",
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
