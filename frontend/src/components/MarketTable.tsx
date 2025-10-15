import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAssetsStore } from "../stores/assets";

export const MarketTable: React.FC = () => {
  const assetsMap = useAssetsStore((state) => state.assetsMap); // stable reference
  const assets = useMemo(() => Object.values(assetsMap), [assetsMap]);
  const updateTimesRef = useRef<Record<string, number>>({}); // track flash timestamps
  const [flashTrigger, setFlashTrigger] = useState(0);

  // watch assets changes to trigger flash
  useEffect(() => {
    console.log("working");
    const now = Date.now();
    const newUpdateTimes: Record<string, number> = {};
    assets.forEach((a) => {
      const prevTime = updateTimesRef.current[a.symbol] ?? 0;
      // naive flash trigger: if price changed, mark nowG
      newUpdateTimes[a.symbol] = prevTime;
    });
    updateTimesRef.current = newUpdateTimes;
  }, [assets]);

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <div className="grid grid-cols-4 gap-2 text-gray-500 font-semibold border-b border-gray-300 pb-2">
        <div>Symbol</div>
        <div>Last Price</div>
        <div>24h Change %</div>
        <div>Volume</div>
      </div>

      {assets.map((a) => {
        const priceChange = Math.random() > 0.5 ? "up" : "down"; // placeholder for flash
        return (
          <div
            key={a.symbol}
            className={`grid grid-cols-4 gap-2 py-2 border-b border-gray-200 transition-colors duration-300 ${
              priceChange === "up"
                ? "bg-green-100"
                : priceChange === "down"
                ? "bg-red-100"
                : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="font-bold">{a.symbol}</span>
              <span className="text-xs px-1 bg-gray-200 rounded">
                {a.chain}
              </span>
            </div>
            <div>${a.price.toFixed(2)}</div>
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
