import React, { useState } from "react";
import type { Asset, Order } from "../types/models";
import { currencyFormat } from "../utils/utils";

function makeClientId() {
  return `client_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

const OrderForm: React.FC<{
  initialSymbol: string;
  assetsMap: Record<string, Asset>;
  onCancel: () => void;
  onOptimisticSubmit: (order: Order) => void;
}> = ({ initialSymbol, assetsMap, onCancel, onOptimisticSubmit }) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState<number>(0.01);
  const [submitting, setSubmitting] = useState(false);
  const asset = assetsMap[symbol];
  const price = asset?.price ?? 0;

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!asset) return alert("Select an asset");
    if (!qty || qty <= 0) return alert("Invalid quantity");

    setSubmitting(true);

    const clientId = makeClientId();
    const now = new Date().toISOString();

    const optimistic: Order = {
      clientId,
      symbol,
      side,
      qty,
      price,
      status: "pending",
      ts: now,
      notes: "optimistic",
    };

    onOptimisticSubmit(optimistic);

    try {
      await fetch(`http://localhost:4000/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer demo",
        },
        body: JSON.stringify({ symbol, side, qty, clientId }),
      });
    } catch (err) {
      console.error("Order submit failed", err);
      alert("Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Place Order</h3>
        <button
          onClick={onCancel}
          className="text-sm px-2 py-1 rounded border hover:bg-gray-50"
        >
          Go back
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <div className="text-xs text-gray-600 mb-1">Symbol</div>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {Object.values(assetsMap).map((a: any) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-xs text-gray-600 mb-1">Side</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSide("buy")}
              className={`px-3 py-1 rounded border ${
                side === "buy" ? "bg-green-100" : ""
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide("sell")}
              className={`px-3 py-1 rounded border ${
                side === "sell" ? "bg-red-100" : ""
              }`}
            >
              Sell
            </button>
          </div>
        </label>

        <label className="block">
          <div className="text-xs text-gray-600 mb-1">Quantity</div>
          <input
            type="number"
            step="any"
            min={0}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full p-2 border rounded font-mono"
          />
        </label>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Price:{" "}
            <span className="font-mono">
              {price ? currencyFormat(price) : "-"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !asset || !(qty > 0)}
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Place Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
