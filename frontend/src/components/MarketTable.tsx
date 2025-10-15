import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAssetsStore } from "../stores/assets";
import type { Order } from "../types/models";
import OrderForm from "./OrderForm";
import OrdersList from "./OrdersList";
import { currencyFormat } from "../utils/utils";

const FLASH_BG_UP = "bg-green-100";
const FLASH_BG_DOWN = "bg-red-100";

export const MarketTable: React.FC = () => {
  const assetsMap = useAssetsStore((state) => state.assetsMap);
  const assets = useMemo(() => Object.values(assetsMap), [assetsMap]);

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const optimisticRef = useRef<Order[]>([]);

  const mergedOrders = useMemo(() => {
    const presentClientIds = new Set(
      serverOrders.map((s) => s.clientId).filter(Boolean)
    );
    const pending = optimisticRef.current.filter(
      (o) => !presentClientIds.has(o.clientId)
    );
    return [...serverOrders, ...pending];
  }, [serverOrders]);

  // Polling GET /orders to reconcile fills
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(async () => {
      const res = await fetch("http://localhost:4000/orders", {
        headers: { Authorization: "Bearer demo" },
      });
      if (!res.ok) return;
      const list: Order[] = await res.json();
      if (!mounted) return;
      setServerOrders(list);
      // remove reconciled optimistic orders
      const ids = new Set(list.map((l) => l.clientId).filter(Boolean));
      optimisticRef.current = optimisticRef.current.filter(
        (o) => !ids.has(o.clientId)
      );
    }, 1000);

    // do an immediate fetch on mount
    const fetchOrders = async () => {
      const res = await fetch("http://localhost:4000/orders", {
        headers: { Authorization: "Bearer demo" },
      });
      if (res.ok) {
        const list: Order[] = await res.json();
        if (mounted) setServerOrders(list);
      }
    };
    fetchOrders();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleOptimisticSubmit = (order: Order) => {
    optimisticRef.current = [order, ...optimisticRef.current];
    setServerOrders((s) => s);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      {selectedSymbol ? (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <OrderForm
              initialSymbol={selectedSymbol}
              assetsMap={assetsMap}
              onCancel={() => setSelectedSymbol(null)}
              onOptimisticSubmit={(o) => handleOptimisticSubmit(o)}
            />
          </div>

          <div>
            <OrdersList orders={mergedOrders} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 text-gray-500 font-semibold border-b border-gray-300 pb-2">
            <div>Symbol</div>
            <div>Last Price</div>
            <div>24h Change %</div>
            <div>Volume</div>
          </div>
          {assets.map((a: any) => {
            const isFlashing = !!a.lastChangeAt;
            const bgClass = isFlashing
              ? a.lastChangeDirection === "up"
                ? FLASH_BG_UP
                : FLASH_BG_DOWN
              : "";

            return (
              <div
                key={a.symbol}
                onClick={() => setSelectedSymbol(a.symbol)}
                className={`cursor-pointer grid grid-cols-4 gap-2 py-2 border-b border-gray-200 transition-colors duration-300 ${bgClass} hover:bg-gray-50`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold">{a.symbol}</span>
                  <span className="text-xs px-1 bg-gray-200 rounded">
                    {a.chain}
                  </span>
                </div>

                <div
                  className={`flex items-center ${isFlashing ? "throb" : ""}`}
                >
                  <span className="font-mono">{currencyFormat(a.price)}</span>
                </div>

                <div
                  className={
                    a.change24hPct >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {Number(a.change24hPct).toFixed(2)}%
                </div>

                <div>{(a.volume24h ?? 0).toLocaleString()}</div>
              </div>
            );
          })}

          <div className="mt-6">
            <OrdersList orders={mergedOrders} />
          </div>
        </>
      )}
    </div>
  );
};

export default MarketTable;
