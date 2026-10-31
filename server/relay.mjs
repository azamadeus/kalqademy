// Relay for the live mode. One room per code. The host (identified by a secret token) sends events to
// everyone; players only set their presence (name, answer), and that goes to the host alone, so traffic
// grows linearly with the number of players, not quadratically. Nothing is stored.
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 8787);
const MAX_PLAYERS = Number(process.env.MAX_PLAYERS || 400);
const MAX_MSG = 16 * 1024;
const RATE = 30; // messages per second per client
const rooms = new Map(); // code -> { hostToken, hostId, clients: Map<id, { ws, presence }> }

const wss = new WebSocketServer({ port: PORT, maxPayload: MAX_MSG });
let nextId = 1;

const send = (ws, obj) => { if (ws.readyState === 1) ws.send(typeof obj === "string" ? obj : JSON.stringify(obj)); };
const host = (room) => room.clients.get(room.hostId);

wss.on("connection", (ws) => {
  const id = "p" + nextId++;
  let room = null;
  let code = "";
  let tokens = RATE;
  const refill = setInterval(() => { tokens = RATE; }, 1000);
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (raw) => {
    if (--tokens < 0) return;
    let m;
    try { m = JSON.parse(String(raw)); } catch { return; }
    if (m.t === "join" && !room) {
      code = String(m.room || "").toUpperCase();
      if (!/^[A-Z0-9]{3,8}$/.test(code)) return ws.close();
      room = rooms.get(code);
      if (!room) {
        if (m.role !== "host") { room = null; return send(ws, { t: "error", code: "no_room" }); }
        room = { hostToken: String(m.token || ""), hostId: id, clients: new Map() };
        rooms.set(code, room);
      } else if (m.role === "host") {
        if (!m.token || m.token !== room.hostToken) { room = null; return send(ws, { t: "error", code: "not_host" }); }
        room.hostId = id;
      }
      if (room.clients.size >= MAX_PLAYERS + 1) { room = null; return send(ws, { t: "error", code: "full" }); }
      room.clients.set(id, { ws, presence: {} });
      const isHost = id === room.hostId;
      send(ws, { t: "joined", id, host: isHost });
      if (isHost) {
        // a (re)joining host gets everyone who is already here
        send(ws, { t: "peers", peers: [...room.clients.entries()].filter(([k]) => k !== id).map(([k, c]) => ({ id: k, presence: c.presence })) });
      } else {
        const h = host(room);
        if (h) send(h.ws, { t: "peer", id, presence: {} });
      }
    } else if (room && m.t === "emit") {
      if (id !== room.hostId) return send(ws, { t: "error", code: "not_permitted" });
      const text = JSON.stringify({ t: "msg", topic: String(m.topic).slice(0, 40), data: m.data });
      for (const c of room.clients.values()) send(c.ws, text);
    } else if (room && m.t === "presence") {
      const c = room.clients.get(id);
      if (!c || id === room.hostId) return;
      const next = { ...c.presence, ...(m.patch && typeof m.patch === "object" ? m.patch : {}) };
      if (JSON.stringify(next).length > 1024) return;
      c.presence = next;
      const h = host(room);
      if (h) send(h.ws, { t: "peer", id, presence: next });
    }
  });

  ws.on("close", () => {
    clearInterval(refill);
    if (!room) return;
    room.clients.delete(id);
    if (room.clients.size === 0) return void rooms.delete(code);
    const h = host(room);
    if (h && id !== room.hostId) send(h.ws, { t: "left", id });
  });
});

// drop dead connections
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 25000);

console.log(`relay listening on :${PORT} (max ${MAX_PLAYERS} players per room)`);
