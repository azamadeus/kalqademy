import type { LivePeer, Transport, TransportResult } from "./transport";

interface RoomPeer { peer: string; isMe: boolean; presence: Readonly<Record<string, unknown>> }
interface NamedRoom {
  emit(topic: string, data?: unknown): Promise<void>;
  on(topic: string, h: (m: { data?: unknown }) => void): () => void;
  presence(patch: Record<string, unknown>): Promise<void>;
  peers(): readonly RoomPeer[];
  onPeers(h: (c: { peers: readonly RoomPeer[] }) => void): () => void;
  leave(): Promise<void>;
}
interface RoomNs { join(name: string): Promise<NamedRoom> }

/** The artifact `room` capability: everyone who has the page open now (signed-in members and invited guests). */
export async function connectRoom(code: string, role: "host" | "player"): Promise<TransportResult> {
  const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
  if (!c?.use) return { ok: false, reason: "unavailable" };
  const ns = (await c.use("room").catch(() => null)) as RoomNs | null;
  if (!ns) return { ok: false, reason: "unavailable" };
  let room: NamedRoom;
  try { room = await ns.join(`kq-${code.toLowerCase()}`); } catch { return { ok: false, reason: "unavailable" }; }
  const map = (a: readonly RoomPeer[]): LivePeer[] => a.map((p) => ({ id: p.peer, isMe: p.isMe, presence: p.presence as Record<string, unknown> }));
  const t: Transport = {
    kind: "room",
    emit: (topic, data) => room.emit(topic, data),
    on: (topic, fn) => room.on(topic, (m) => fn(m.data)),
    presence: (patch) => { void room.presence(patch); },
    peers: () => map(room.peers()),
    onPeers: (fn) => room.onPeers((ch) => fn(map(ch.peers))),
    close: () => { void room.leave(); },
  };
  if (role === "host") {
    try { await room.emit("hello", { t: Date.now() }); } catch { return { ok: false, reason: "not_host" }; }
  }
  return { ok: true, t };
}
