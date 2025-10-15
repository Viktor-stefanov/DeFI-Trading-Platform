import { create } from "zustand";
import type { Asset } from "../types/models";

const MAX_HISTORY = 5;

interface AssetsState {
  assetsMap: Record<string, Asset>;
  setAssets: (newAssets: Asset[]) => void;
  updateAsset: (symbol: string, partial: Partial<Asset>) => void;
  getAssetList: () => Asset[];
}

export const useAssetsStore = create<AssetsState>((set, get) => ({
  assetsMap: {},

  setAssets: (newAssets: Asset[]) =>
    set({
      assetsMap: Object.fromEntries(
        newAssets.map((a) => [
          a.symbol,
          {
            ...a,
            priceHistory: [a.price],
            lastChangeAt: null,
            lastChangeDirection: null,
          } as Asset,
        ])
      ),
    }),

  updateAsset: (symbol, partial) =>
    set((state) => {
      const asset = state.assetsMap[symbol];
      if (!asset) return {};
      let newHistory = asset.priceHistory
        ? [...asset.priceHistory]
        : [asset.price];
      if (typeof partial.price === "number") {
        newHistory = [partial.price, ...newHistory].slice(0, MAX_HISTORY);
      }

      const updated: Asset = {
        ...asset,
        ...partial,
        priceHistory: newHistory,
      };

      return {
        assetsMap: { ...state.assetsMap, [symbol]: updated },
      };
    }),

  getAssetList: () => Object.values(get().assetsMap),
}));
