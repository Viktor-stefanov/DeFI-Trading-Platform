// src/routes/orders.ts
import express from "express";
import { authHeaderIsValid, validateOrderBody } from "../utils/validators";
import {
  getAsset,
  addOptimisticOrder,
  replaceOrderByClientId,
  getOrders,
} from "../state/store";
import type { Order } from "../types/models";

const router = express.Router();

let serverOrderCounter = 1;

/**
 * GET /orders
 * Requires Authorization header.
 */
router.get("/", (req, res) => {
  if (!authHeaderIsValid(req.header("authorization"))) {
    return res.status(401).json({ message: "unauthorized" });
  }
  const list = getOrders({ limit: 200 });
  res.json(list);
});

/**
 * POST /orders
 * Body: { symbol, side, qty, clientId? }
 * Simple synchronous processing: validate, then "fill" based on AMM.
 */
router.post("/", (req, res) => {
  if (!authHeaderIsValid(req.header("authorization"))) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const validation = validateOrderBody(req.body);
  if (!validation.ok)
    return res.status(400).json({ message: validation.reason });

  const { symbol, side, qty, clientId } = req.body;
  const asset = getAsset(symbol);
  if (!asset) return res.status(400).json({ message: "invalid symbol" });

  // optimistic record (server-side): we'll return a filled order at current price (no slippage)
  const price = asset.price;
  const serverOrder: Order = {
    id: `order_${String(serverOrderCounter++).padStart(6, "0")}`,
    clientId: clientId,
    symbol,
    side,
    qty,
    price,
    status: "filled",
    ts: new Date().toISOString(),
    fee: 0,
    slippagePct: 0,
  };

  // reconcile with any optimistic client entry if provided
  if (clientId) {
    replaceOrderByClientId(clientId, serverOrder);
  } else {
    addOptimisticOrder(serverOrder);
  }

  res.status(201).json(serverOrder);
});

export default router;
