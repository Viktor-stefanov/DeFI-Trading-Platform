import express, { Request, Response, NextFunction } from "express";
import {
  getAsset,
  updateAssetTick,
  replaceOrderByClientId,
  addOptimisticOrder,
  getOrders,
} from "../state/store";
import { tokenIsValid, validateOrderBody } from "../utils/validators";
import type { Order } from "../types/models";

const router = express.Router();
const ORDER_FILL_DELAY_MS = 1500;

/**
 * Auth middleware: expects "Authorization: Bearer <token>"
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"] ?? req.headers["Authorization"];
  let token: string | undefined;
  if (typeof auth === "string") {
    const parts = auth.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) token = parts[1];
  }
  if (!tokenIsValid(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

/**
 * Create a reasonably-unique client-generated id (used for optimistic matching).
 */
function makeClientId(): string {
  return `client_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

/**
 * Create a server-side order id.
 */
function makeServerId(): string {
  return `order_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

/**
 * POST /orders
 * - Accepts: { symbol, side, qty, clientId? }
 * - Returns immediately with an optimistic order (status: "pending", includes clientId)
 * - After ORDER_FILL_DELAY_MS the server will "fill" the order and replace it with a server-confirmed order
 */
router.post(
  "/orders",
  requireAuth,
  express.json(),
  (req: Request, res: Response) => {
    const body = req.body;

    const v = validateOrderBody(body);
    if (!v.ok) return res.status(400).json({ error: v.reason });

    const { symbol, side, qty } = body as {
      symbol: string;
      side: "buy" | "sell";
      qty: number;
    };
    const clientIdInput =
      (body && body.clientId && String(body.clientId)) || undefined;
    const clientId = clientIdInput ?? makeClientId();

    const asset = getAsset(symbol);
    if (!asset) {
      return res.status(400).json({ error: "Unknown symbol" });
    }

    const price = asset.price;
    const now = new Date().toISOString();

    const optimisticOrder: Partial<Order> = {
      clientId,
      symbol,
      side,
      qty,
      price,
      status: "pending",
      ts: now,
      notes: "optimistic",
    };

    try {
      addOptimisticOrder(optimisticOrder as Order);

      res.status(201).json(optimisticOrder);

      setTimeout(() => {
        try {
          const filledTs = new Date().toISOString();
          const serverOrder: Order = {
            id: makeServerId(),
            clientId,
            symbol,
            side,
            qty,
            price,
            status: "filled",
            filledQty: qty,
            avgPrice: price,
            notes: "market-filled (delayed)",
            ts: filledTs,
          } as unknown as Order; // don't judge I don't have time

          replaceOrderByClientId(clientId, serverOrder);

          updateAssetTick(symbol, { price, volume: qty, ts: filledTs });
        } catch (err) {
          console.error("Delayed fill failed:", err);
        }
      }, ORDER_FILL_DELAY_MS);
    } catch (err) {
      console.error("Failed to accept order:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Internal error" });
      }
    }
  }
);

/**
 * GET /orders
 * Returns the in-memory orders list.
 */
router.get("/orders", requireAuth, (req: Request, res: Response) => {
  try {
    const list = getOrders();
    return res.json(list);
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
