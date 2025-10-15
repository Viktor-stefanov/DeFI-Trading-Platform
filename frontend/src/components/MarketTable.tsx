import React, { useMemo } from "react";
import { useAssetsStore } from "../stores/assets";

const FLASH_BG_UP = "bg-green-100";
const FLASH_BG_DOWN = "bg-red-100";

export const MarketTable: React.FC = () => {
  const assetsMap = useAssetsStore((state) => state.assetsMap);
  const assets = useMemo(() => Object.values(assetsMap), [assetsMap]);

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <div className="grid grid-cols-4 gap-2 text-gray-500 font-semibold border-b border-gray-300 pb-2">
        <div>Symbol</div>
        <div>Last Price</div>
        <div>24h Change %</div>
        <div>Volume</div>
      </div>

      {assets.map((a) => {
        const isFlashing = !!a.lastChangeAt;
        const bgClass = isFlashing
          ? a.lastChangeDirection === "up"
            ? FLASH_BG_UP
            : FLASH_BG_DOWN
          : "";

        return (
          <div
            key={a.symbol}
            className={`grid grid-cols-4 gap-2 py-2 border-b border-gray-200 transition-colors duration-300 ${bgClass}`}
          >
            <div className="flex items-center space-x-2">
              <span className="font-bold">{a.symbol}</span>
              <span className="text-xs px-1 bg-gray-200 rounded">
                {a.chain}
              </span>
            </div>

            <div className={`flex items-center ${isFlashing ? "throb" : ""}`}>
              <span className="font-mono">${a.price.toFixed(2)}</span>
            </div>

            <div
              className={
                a.change24hPct >= 0 ? "text-green-600" : "text-red-600"
              }
            >
              {a.change24hPct.toFixed(2)}%
            </div>

            <div>{a.volume24h.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketTable;
