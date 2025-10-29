import axios, { AxiosInstance } from "axios";

// Placeholder baseURL: set VITE_API_BASE_URL in your environment or replace at runtime.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Send cookies (HttpOnly session) by default so server-side sessions work across requests
  withCredentials: true,
});

export default client;
