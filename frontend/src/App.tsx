import React from "react";
import MarketTable from "./components/MarketTable";
import useWsTicker from "./hooks/useWsTicker";
import { useWsStore } from "./stores/ws";

const App: React.FC = () => {
  const WS_URL = "ws://localhost:4000/ws/ticker?token=demo";

  const { reconnect } = useWsTicker(WS_URL);
  const connected = useWsStore((s) => s.connected);
  const error = useWsStore((s) => s.error);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-8 text-center">
        Mini Real-Time Trading Panel
      </h1>

      {!connected && (
        <div>
          <div className="p-2 mb-4 bg-red-100 text-red-700 rounded text-center">
            {error || "Connecting..."}
          </div>
          <div className="text-center">
            <button
              onClick={() => reconnect()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry connection
            </button>
          </div>
        </div>
      )}

      <MarketTable />
    </div>
  );
};

export default App;
