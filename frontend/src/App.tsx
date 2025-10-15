import React from "react";
import { MarketTable } from "./components/MarketTable";
import { useWsTicker } from "./hooks/useWsTicker";
import { useWsStore } from "./stores/ws";

const App: React.FC = () => {
  const WS_URL = "ws://localhost:4000/ws/ticker?token=demo";

  useWsTicker(WS_URL);
  const connected = useWsStore((s) => s.connected);
  const error = useWsStore((s) => s.error);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Mini Real-Time Trading Panel</h1>

      {!connected && (
        <div className="p-2 mb-4 bg-red-100 text-red-700 rounded">
          {error || "Connecting..."}
        </div>
      )}

      <MarketTable />
    </div>
  );
};

export default App;
