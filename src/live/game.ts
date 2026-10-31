/** Pure parts of the live (Kahoot-style) mode. */
export const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const MAX_PLAYERS = 50;

export const newCode = (): string => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

/** Faster correct answers earn more, between 500 and 1000 points; a wrong answer earns nothing. */
export function pointsFor(correct: boolean, elapsedMs: number, limitMs: number): number {
  if (!correct) return 0;
  const f = Math.min(1, Math.max(0, elapsedMs / Math.max(1, limitMs)));
  return Math.round(1000 * (1 - f / 2));
}

export const trimName = (s: unknown): string => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 16);

export const short = (id: string): string => id.slice(0, 6);

export type Phase = "lobby" | "question" | "reveal" | "board" | "end";

export interface StateMsg {
  phase: Phase;
  code: string;
  i: number;
  total: number;
  /** Milliseconds left to answer (question phase). */
  endsIn: number;
  players: number;
  answered: number;
  right: number[];
}
export interface QuestionMsg { i: number; title: string; text: string; options: string[] }
export interface HintMsg { i: number; hint: string[]; counts: number[] }
export interface ScoreMsg {
  i: number;
  /** Top of the board: [name, score]. */
  board: [string, number][];
  /** Every player: [short id, score, gained in this question, rank]. */
  s: [string, number, number, number][];
}

export interface Scores {
  total: Record<string, number>;
  gained: Record<string, number>;
  names: Record<string, string>;
}

/** Ranks players by total score (ties keep join order). */
export function rankPlayers(scores: Scores, ids: string[]): { id: string; name: string; score: number; gained: number; rank: number }[] {
  const rows = ids.map((id) => ({ id, name: scores.names[id] ?? "?", score: scores.total[id] ?? 0, gained: scores.gained[id] ?? 0 }));
  rows.sort((a, b) => b.score - a.score);
  return rows.map((r, k) => ({ ...r, rank: k + 1 }));
}

export function scoreMsg(i: number, ranked: ReturnType<typeof rankPlayers>): ScoreMsg {
  return { i, board: ranked.slice(0, 8).map((r) => [r.name, r.score]), s: ranked.map((r) => [short(r.id), r.score, r.gained, r.rank]) };
}

export const bytes = (x: unknown) => new TextEncoder().encode(JSON.stringify(x)).length;
