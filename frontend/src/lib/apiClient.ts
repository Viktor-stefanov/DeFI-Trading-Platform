import axios, { AxiosInstance } from "axios";

// Placeholder baseURL: set VITE_API_BASE_URL in your environment or replace at runtime.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Send cookies (HttpOnly session) by default so server-side sessions work across requests
client.defaults.withCredentials = true;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common["Authorization"];
  }
  // Emit a global event so app-level providers can react to token changes
  try {
    const win = window as unknown as EventTarget;
    win.dispatchEvent(new CustomEvent("auth:token-changed", { detail: token }));
  } catch {
    // Ignore if window/event not available (e.g., SSR)
  }
}

export function getAuthToken() {
  return authToken;
}

export default client;
