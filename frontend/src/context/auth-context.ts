import { createContext } from "react";

export type AuthContextShape = {
  isAuthenticated: boolean;
  loading: boolean;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextShape | undefined>(
  undefined
);
