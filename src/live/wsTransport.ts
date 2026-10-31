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

type Inbound = { t: string; id?: string; code?: string; topic?: string; data?: unknown; presence?: Record<string, unknown>; peers?: { id: string; presence: Record<string, unknown> }[] };

export function connectWs(url: string, code: string, role: "host" | "player"): Promise<TransportResult> {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    let myId = "";
    const peerMap = new Map<string, LivePeer>();
    let snapshot: LivePeer[] = [];
    const topics = new Map<string, Set<(d: unknown) => void>>();
    const peerFns = new Set<(p: LivePeer[]) => void>();
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (r: TransportResult) => { if (!done) { done = true; resolve(r); } };
    // many answers arrive at once: tell the page at most ten times a second
    const notify = () => {
      if (timer) return;
      timer = setTimeout(() => { timer = null; snapshot = [...peerMap.values()]; peerFns.forEach((f) => f(snapshot)); }, 100);
    };
    ws.onopen = () => ws.send(JSON.stringify({ t: "join", room: code, role, token: role === "host" ? hostToken(code) : undefined }));
    ws.onerror = () => finish({ ok: false, reason: "unavailable" });
    ws.onclose = () => finish({ ok: false, reason: "unavailable" });
    ws.onmessage = (ev) => {
      let m: Inbound;
      try { m = JSON.parse(String(ev.data)); } catch { return; }
      if (m.t === "error") return finish({ ok: false, reason: m.code === "no_room" || m.code === "full" || m.code === "not_host" ? m.code : "unavailable" });
      if (m.t === "joined") {
        myId = m.id ?? "";
        const t: Transport = {
          kind: "ws",
          emit: async (topic, data) => { ws.send(JSON.stringify({ t: "emit", topic, data })); },
          on: (topic, fn) => { const s = topics.get(topic) ?? new Set(); s.add(fn); topics.set(topic, s); return () => s.delete(fn); },
          presence: (patch) => ws.send(JSON.stringify({ t: "presence", patch })),
          peers: () => snapshot,
          onPeers: (fn) => { peerFns.add(fn); fn(snapshot); return () => peerFns.delete(fn); },
          close: () => ws.close(),
          myId: () => myId,
        };
        return finish({ ok: true, t });
      }
      if (m.t === "msg" && m.topic) topics.get(m.topic)?.forEach((f) => f(m.data));
      else if (m.t === "peers" && m.peers) { peerMap.clear(); for (const p of m.peers) peerMap.set(p.id, { id: p.id, isMe: false, presence: p.presence }); notify(); }
      else if (m.t === "peer" && m.id) { peerMap.set(m.id, { id: m.id, isMe: false, presence: m.presence ?? {} }); notify(); }
      else if (m.t === "left" && m.id) { peerMap.delete(m.id); notify(); }
    };
  });
}
