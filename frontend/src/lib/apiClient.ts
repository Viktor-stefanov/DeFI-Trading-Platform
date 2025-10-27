import axios, { AxiosInstance } from "axios";

// Placeholder baseURL: set VITE_API_BASE_URL in your environment or replace at runtime.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common["Authorization"];
  }
}

export function getAuthToken() {
  return authToken;
}

export default client;
