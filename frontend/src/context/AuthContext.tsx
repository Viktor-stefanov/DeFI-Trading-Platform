import React, { useEffect, useState } from "react";
import { getAuthToken, setAuthToken } from "../lib/apiClient";
import { AuthContext, AuthContextShape } from "./auth-context";
import client from "../lib/apiClient";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!getAuthToken()
  );

  console.debug("AuthProvider init", {
    token: token ? `${token.slice(0, 8)}...` : null,
    isAuthenticated: !!token,
  });

  useEffect(() => {
    const handler = (e: Event) => {
      // event detail contains the token (or null)
      const detail = (e as CustomEvent).detail as string | null;
      console.debug("AuthProvider event auth:token-changed", { detail });
      setTokenState(detail ?? null);
      // if token present, consider authenticated
      if (detail) setIsAuthenticated(true);
    };

    const sessionHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        authenticated?: boolean;
      } | null;
      console.debug("AuthProvider event auth:session-changed", { detail });
      if (detail?.authenticated) setIsAuthenticated(true);
    };

    window.addEventListener("auth:token-changed", handler as EventListener);
    window.addEventListener(
      "auth:session-changed",
      sessionHandler as EventListener
    );
    return () => {
      window.removeEventListener(
        "auth:token-changed",
        handler as EventListener
      );
      window.removeEventListener(
        "auth:session-changed",
        sessionHandler as EventListener
      );
    };
  }, []);

  // check server-side session (HttpOnly cookie) on mount
  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        // use relative path so axios instance baseURL and withCredentials are applied
        const resp = await client.get("/api/auth/me");
        const data = resp.data ?? {};
        console.debug("AuthProvider /api/auth/me response", {
          status: resp.status,
          data,
        });
        if (!mounted) return;
        if (data.authenticated) {
          console.debug("AuthProvider detected authenticated session", {
            user: data.user ?? data.payload ?? null,
          });
          setIsAuthenticated(true);
        } else {
          console.debug("AuthProvider detected no session");
          setIsAuthenticated(false);
        }
      } catch {
        // treat as not authenticated on error
        setIsAuthenticated(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  const setToken = (t: string | null) => {
    // set in axios client (will emit the global event which updates local state)
    console.debug("AuthProvider setToken called", {
      token: t ? `${t.slice(0, 8)}...` : null,
    });
    setAuthToken(t);
    // Also update local state proactively for immediate consistency
    setTokenState(t);
  };

  const logout = () => {
    console.debug("AuthProvider logout called");
    setToken(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextShape = {
    token,
    isAuthenticated,
    loading,
    setToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// NOTE: the hook `useAuthContext` is provided in a separate file to keep this
// file focused on the provider component (improves Fast Refresh behavior).
