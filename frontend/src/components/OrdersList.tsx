import type { Order } from "../types/models";
import { currencyFormat } from "../utils/utils";

const OrdersList: React.FC<{ orders: Order[] }> = ({ orders }) => {
  if (!orders || orders.length === 0)
    return <div className="p-4 text-sm text-gray-500">No orders yet</div>;

  return (
    <div className="mt-4 p-2 bg-white rounded shadow-sm">
      <div className="text-xl  font-semibold mb-2">Orders</div>
      <div className="space-y-2">
        {orders.map((o) => (
          <div
            key={o.clientId ?? o.id}
            className={`p-2 border rounded flex justify-between items-center ${
              o.status === "pending" ? "opacity-90" : "bg-gray-50"
            }`}
          >
            <div>
              <div className="font-semibold">
                {o.symbol} - {o.side.toUpperCase()}
              </div>
              <div className="text-xs text-gray-600">
                qty: {o.qty} | price: {currencyFormat(o.price)} | status:{" "}
                {o.status}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {o.ts ? new Date(o.ts).toLocaleTimeString() : "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersList;
