import type { LivePeer, Transport, TransportResult } from "./transport";

function hostToken(code: string): string {
  const key = `kq-host-${code}`;
  try {
    let t = sessionStorage.getItem(key);
    if (!t) { t = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); sessionStorage.setItem(key, t); }
    return t;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export function connectWs(url: string, code: string, role: "host" | "player"): Promise<TransportResult> {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    let myId = "";
    let peers: LivePeer[] = [];
    const topics = new Map<string, Set<(d: unknown) => void>>();
    const peerFns = new Set<(p: LivePeer[]) => void>();
    let done = false;
    const finish = (r: TransportResult) => { if (!done) { done = true; resolve(r); } };
    ws.onopen = () => ws.send(JSON.stringify({ t: "join", room: code, role, token: role === "host" ? hostToken(code) : undefined }));
    ws.onerror = () => finish({ ok: false, reason: "unavailable" });
    ws.onclose = () => finish({ ok: false, reason: "unavailable" });
    ws.onmessage = (ev) => {
      let m: { t: string; id?: string; code?: string; topic?: string; data?: unknown; peers?: { id: string; presence: Record<string, unknown> }[] };
      try { m = JSON.parse(String(ev.data)); } catch { return; }
      if (m.t === "error") return finish({ ok: false, reason: m.code === "no_room" || m.code === "full" || m.code === "not_host" ? m.code : "unavailable" });
      if (m.t === "joined") {
        myId = m.id ?? "";
        const t: Transport = {
          kind: "ws",
          emit: async (topic, data) => { ws.send(JSON.stringify({ t: "emit", topic, data })); },
          on: (topic, fn) => { const s = topics.get(topic) ?? new Set(); s.add(fn); topics.set(topic, s); return () => s.delete(fn); },
          presence: (patch) => ws.send(JSON.stringify({ t: "presence", patch })),
          peers: () => peers,
          onPeers: (fn) => { peerFns.add(fn); fn(peers); return () => peerFns.delete(fn); },
          close: () => ws.close(),
        };
        return finish({ ok: true, t });
      }
      if (m.t === "msg" && m.topic) topics.get(m.topic)?.forEach((f) => f(m.data));
      if (m.t === "peers" && m.peers) {
        peers = m.peers.map((p) => ({ id: p.id, isMe: p.id === myId, presence: p.presence }));
        peerFns.forEach((f) => f(peers));
      }
    };
  });
}
