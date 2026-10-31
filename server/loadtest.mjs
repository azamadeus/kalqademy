// Load test: N bots join a room and answer like phones would. Usage: node loadtest.mjs ws://localhost:8787 CODE 200
import WebSocket from "ws";
const [url, code, n = "200"] = process.argv.slice(2);
const N = Number(n);
let connected = 0, answered = 0, bytes = 0, firstQ = [], errors = 0;
const t0 = Date.now();
for (let k = 0; k < N; k++) {
  setTimeout(() => {
    const ws = new WebSocket(url);
    let lastQ = -1;
    ws.on("open", () => ws.send(JSON.stringify({ t: "join", room: code, role: "player" })));
    ws.on("error", () => errors++);
    ws.on("message", (raw) => {
      bytes += raw.length;
      const m = JSON.parse(String(raw));
      if (m.t === "joined") { connected++; ws.send(JSON.stringify({ t: "presence", patch: { kind: "player", name: "Бот " + k, q: -1, a: -1 } })); }
      if (m.t === "error") errors++;
      if (m.t === "msg" && m.topic === "st" && m.data.phase === "question" && m.data.i !== lastQ) {
        lastQ = m.data.i;
        firstQ.push(Date.now() - t0);
        setTimeout(() => { answered++; ws.send(JSON.stringify({ t: "presence", patch: { q: m.data.i, a: Math.floor(Math.random() * 4) } })); }, 500 + Math.random() * 9000);
      }
    });
  }, k * 15); // phones join over ~3 s
}
setInterval(() => console.log(`connected ${connected}/${N}  answers sent ${answered}  recv ${(bytes / 1024 / 1024).toFixed(2)} MB  errors ${errors}`), 3000);
