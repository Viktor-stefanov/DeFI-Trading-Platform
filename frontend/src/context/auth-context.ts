import { createContext } from "react";

export type AuthContextShape = {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setToken: (t: string | null) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextShape | undefined>(
  undefined
);
