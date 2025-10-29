import type { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket as WSClient } from "ws";

const clients = new Set<WSClient>();

export function setupWsServer(server: HTTPServer) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  return {
    broadcast: (data: any) => {
      const payload = JSON.stringify(data);
      for (const ws of clients) {
        if (ws.readyState === ws.OPEN) ws.send(payload);
      }
    },
  };
}
