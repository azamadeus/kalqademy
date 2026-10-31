export interface LivePeer {
  id: string;
  isMe: boolean;
  presence: Record<string, unknown>;
}

/** What the live mode needs from a network: host events, per-player presence, who is here. */
export interface Transport {
  kind: "room" | "ws";
  /** Host only: send an event to everyone. */
  emit(topic: string, data: unknown): Promise<void>;
  on(topic: string, fn: (data: unknown) => void): () => void;
  presence(patch: Record<string, unknown>): void;
  peers(): LivePeer[];
  onPeers(fn: (peers: LivePeer[]) => void): () => void;
  close(): void;
  /** This connection's own id (players use it to find their row in the score chunks). */
  myId(): string;
}

export type TransportResult = { ok: true; t: Transport } | { ok: false; reason: "unavailable" | "not_host" | "no_room" | "full" };

const RELAY = (import.meta.env.VITE_RELAY_URL as string | undefined) || "";

/** Connects to a game room by code. Uses the self-hosted relay when one is configured, otherwise the artifact's `room` capability. */
export async function connect(code: string, role: "host" | "player"): Promise<TransportResult> {
  if (RELAY) {
    const { connectWs } = await import("./wsTransport");
    return connectWs(RELAY, code, role);
  }
  const { connectRoom } = await import("./roomTransport");
  return connectRoom(code, role);
}

export const relayConfigured = Boolean(RELAY);
