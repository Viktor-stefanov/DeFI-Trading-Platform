import { create } from "zustand";
import type { Order } from "../types/models";

interface OrdersState {
  orders: Order[];
  addOptimisticOrder: (order: Order) => void;
  updateOrderFromServer: (clientId: string, updatedOrder: Order) => void;
  pruneOldOrders: (max: number) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],

  addOptimisticOrder: (order) =>
    set((state) => ({ orders: [order, ...state.orders] })),

  updateOrderFromServer: (clientId, updatedOrder) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.clientId === clientId ? updatedOrder : o
      ),
    })),

  pruneOldOrders: (max) =>
    set((state) => ({ orders: state.orders.slice(0, max) })),
}));
