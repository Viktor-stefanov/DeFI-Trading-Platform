import React, { useCallback, useEffect, useState } from "react";
import { AuthContext, AuthContextShape } from "./auth-context";
import client from "../lib/apiClient";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const sessionHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        authenticated?: boolean;
      } | null;
      setIsAuthenticated(!!detail?.authenticated);
      setLoading(false);
    };

    window.addEventListener(
      "auth:session-changed",
      sessionHandler as EventListener
    );
    return () => {
      window.removeEventListener(
        "auth:session-changed",
        sessionHandler as EventListener
      );
    };
  }, []);

  // check server-side session (HttpOnly cookie) on mount
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const resp = await client.get("/api/auth/me");
      const data = resp.data ?? {};
      const nextAuth = !!data.authenticated;
      setIsAuthenticated(nextAuth);
      return nextAuth;
    } catch (error) {
      console.error("AuthProvider refreshSession error", error);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      await refreshSession();
      if (mounted) setLoading(false);
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await client.post("/api/auth/logout");
    } catch (error) {
      console.error("AuthProvider logout error", error);
    } finally {
      setIsAuthenticated(false);
      try {
        window.dispatchEvent(
          new CustomEvent("auth:session-changed", {
            detail: { authenticated: false },
          })
        );
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value: AuthContextShape = {
    isAuthenticated,
    loading,
    refreshSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// NOTE: the hook `useAuthContext` is provided in a separate file to keep this
// file focused on the provider component (improves Fast Refresh behavior).
