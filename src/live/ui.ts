export const COLORS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"];
export const SHAPES = ["▲", "◆", "●", "■"];

const FALLBACK = "https://claude.ai/artifact/Fs8Dnrp9GGjfh3tsuFXzUk";
/** Where players open the game: the page itself on a self-hosted build, the published artifact otherwise. */
export function defaultJoinBase(): string {
  const env = import.meta.env.VITE_PUBLIC_URL as string | undefined;
  if (env) return env;
  if (import.meta.env.VITE_RELAY_URL || location.hostname === "localhost") return location.origin + location.pathname;
  return FALLBACK;
}
