import { create } from "zustand";
import type { Asset } from "../types/models";

interface AssetsState {
  assetsMap: Record<string, Asset>; // symbol -> Asset
  setAssets: (newAssets: Asset[]) => void;
  updateAsset: (symbol: string, partial: Partial<Asset>) => void;
  getAssetList: () => Asset[];
}

export const useAssetsStore = create<AssetsState>((set, get) => ({
  assetsMap: {},

  setAssets: (newAssets: Asset[]) =>
    set({
      assetsMap: Object.fromEntries(newAssets.map((a) => [a.symbol, a])),
    }),

  updateAsset: (symbol, partial) =>
    set((state) => {
      const asset = state.assetsMap[symbol];
      if (!asset) return {};
      return {
        assetsMap: { ...state.assetsMap, [symbol]: { ...asset, ...partial } },
      };
    }),

  getAssetList: () => Object.values(get().assetsMap),
}));
