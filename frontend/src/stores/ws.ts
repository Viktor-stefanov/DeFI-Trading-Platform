import { create } from "zustand";

interface WsState {
  connected: boolean;
  error: string | null;
  setConnected: (status: boolean) => void;
  setError: (err: string | null) => void;
}

export const useWsStore = create<WsState>((set) => ({
  connected: false,
  error: null,
  setConnected: (status) => set({ connected: status }),
  setError: (err) => set({ error: err }),
}));
