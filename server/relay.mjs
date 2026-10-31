// Minimal relay for the live mode: one room per code, the host (identified by a secret token) sends
// events to everyone, players only set their presence. No data is stored; rooms vanish when empty.
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 8787);
const MAX_PLAYERS = 60;
const rooms = new Map(); // code -> { hostToken, hostId, clients: Map<id, { ws, presence }> }

const wss = new WebSocketServer({ port: PORT });
let nextId = 1;

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcastPeers(room) {
  const peers = [...room.clients.entries()].map(([id, c]) => ({ id, presence: c.presence, host: id === room.hostId }));
  for (const c of room.clients.values()) send(c.ws, { t: "peers", peers });
}

wss.on("connection", (ws) => {
  const id = "p" + nextId++;
  let room = null;
  let code = "";
  ws.on("message", (raw) => {
    let m;
    try { m = JSON.parse(String(raw)); } catch { return; }
    if (m.t === "join" && !room) {
      code = String(m.room || "").toUpperCase().slice(0, 8);
      if (!/^[A-Z0-9]{3,8}$/.test(code)) return ws.close();
      room = rooms.get(code);
      if (!room) {
        if (m.role !== "host") return send(ws, { t: "error", code: "no_room" });
        room = { hostToken: String(m.token || ""), hostId: id, clients: new Map() };
        rooms.set(code, room);
      } else if (m.role === "host") {
        if (!m.token || m.token !== room.hostToken) return send(ws, { t: "error", code: "not_host" });
        room.hostId = id;
      }
      if (room.clients.size >= MAX_PLAYERS + 1) return send(ws, { t: "error", code: "full" });
      room.clients.set(id, { ws, presence: {} });
      send(ws, { t: "joined", id, host: id === room.hostId });
      broadcastPeers(room);
    } else if (room && m.t === "emit") {
      if (id !== room.hostId) return send(ws, { t: "error", code: "not_permitted" });
      const text = JSON.stringify({ t: "msg", topic: String(m.topic).slice(0, 40), data: m.data });
      if (text.length > 8192) return;
      for (const c of room.clients.values()) if (c.ws.readyState === 1) c.ws.send(text);
    } else if (room && m.t === "presence") {
      const c = room.clients.get(id);
      if (!c) return;
      const next = { ...c.presence, ...(m.patch && typeof m.patch === "object" ? m.patch : {}) };
      if (JSON.stringify(next).length > 1024) return;
      c.presence = next;
      broadcastPeers(room);
    }
  });
  ws.on("close", () => {
    if (!room) return;
    room.clients.delete(id);
    if (room.clients.size === 0) rooms.delete(code);
    else broadcastPeers(room);
  });
});

console.log(`relay listening on :${PORT}`);
