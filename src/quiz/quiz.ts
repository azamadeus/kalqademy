import { EVENTS, type GameEvent } from "../data/events";
import { EGO } from "../data/ego";
import { TYPES } from "../data/mbti";
import { dominantEgo, styleScore } from "../game/engine";
import { createStudent } from "../game/generate";
import { TYPE_CODES } from "../data/mbti";
import { EGO_ORDER } from "../data/ego";
import { mulberry32 } from "../game/rng";
import { fmt } from "../game/text";
import type { Student, Tactic } from "../game/types";
import { LANG, tr } from "../i18n";
import { EGO_ORIGINAL, TYPE_ORIGINAL } from "./original-kk";

export const QUIZ_LENGTH = 10;
/** Options within this many points of the best one count as equally right. */
const TIE = 0.3;
/** A question is only used when the best option leads the runner-up by at least this much. */
const MARGIN = 0.6;

export interface Question {
  event: GameEvent;
  /** Indices of options that count as correct. */
  right: number[];
}

const ALL: Tactic[] = ["listen", "plan", "goal", "challenge", "space", "family", "play"];
const STYLE_WEIGHT = 1;
/** No tactic may be the right answer more than this many times in one quiz, so the answer is not always "listen". */
const TACTIC_CAP = 4;

/** How much a tactic is favoured on average over all types and ego states; removed so no tactic wins by default. */
let baseline: Record<Tactic, number> | null = null;
function tacticBaseline(): Record<Tactic, number> {
  if (baseline) return baseline;
  const sum = Object.fromEntries(ALL.map((t) => [t, 0])) as Record<Tactic, number>;
  let n = 0;
  for (const mbti of TYPE_CODES) for (const dominant of EGO_ORDER) {
    const st = createStudent({ seed: 1, mbti, dominant });
    for (const t of ALL) sum[t] += styleScore(st, t);
    n++;
  }
  for (const t of ALL) sum[t] /= n;
  baseline = sum;
  return sum;
}

/** Situation fit plus how much this student's type and ego state favour the tactic more than a typical student. */
function rawScores(student: Student, event: GameEvent): number[] {
  if (event.serious) return event.options.map((o) => o.fit * 10);
  const base = tacticBaseline();
  return event.options.map((o) => o.fit * 2 + (styleScore(student, o.tactic) - base[o.tactic]) * STYLE_WEIGHT - (o.fit < 0 ? 6 : 0));
}

function rightOptions(student: Student, event: GameEvent): number[] | null {
  const s = rawScores(student, event);
  const top = Math.max(...s);
  const sorted = s.slice().sort((a, b) => b - a);
  if (sorted.length > 1 && sorted[0] - sorted[1] < MARGIN && sorted[0] - sorted[1] >= TIE) return null;
  return s.map((v, i) => (top - v <= TIE ? i : -1)).filter((i) => i >= 0);
}

/** A fixed set of situations for the student: the same student and attempt always give the same quiz. */
export function buildQuiz(student: Student, attempt = 0): Question[] {
  const rng = mulberry32(student.seed * 31 + attempt * 7 + 3);
  const ego = dominantEgo(student);
  const rank = (e: GameEvent) =>
    (e.prone?.ego?.includes(ego) ? 0 : 1) + (e.prone?.letters?.some((l) => student.mbti.includes(l)) ? 0 : 1) + rng() * 1.6;
  const pool = EVENTS.filter((e) => e.id !== "first-message")
    .map((e) => ({ e, r: rank(e) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.e);
  const out: Question[] = [];
  const problems = new Set<string>();
  let serious = 0;
  const used: Record<string, number> = {};
  const first = EVENTS.find((e) => e.id === "first-message")!;
  const firstRight = rightOptions(student, first);
  if (firstRight && firstRight.length === 1) { out.push({ event: first, right: firstRight }); used[first.options[firstRight[0]].tactic] = 1; }
  for (const strict of [true, false]) {
    for (const e of pool) {
      if (out.length >= QUIZ_LENGTH) break;
      if (out.some((x) => x.event.id === e.id)) continue;
      if (strict && problems.has(e.problem)) continue;
      if (e.serious && serious >= 1) continue;
      const right = rightOptions(student, e);
      if (!right || right.length > 1) continue;
      const tac = e.options[right[0]].tactic;
      if (strict && (used[tac] ?? 0) >= TACTIC_CAP) continue;
      used[tac] = (used[tac] ?? 0) + 1;
      problems.add(e.problem);
      if (e.serious) serious++;
      out.push({ event: e, right });
    }
  }
  return out;
}

/** Why the right answer was right, written from what is known about the student. */
export function hintFor(student: Student, q: Question, chosen: number, n = 0): string[] {
  const dom = dominantEgo(student);
  const ego = EGO[dom];
  const type = TYPES[student.mbti];
  const k = n + (student.seed % 5);
  const pickOf = <T,>(a: T[]) => a[k % a.length];
  const lines: string[] = [];
  if (q.event.serious) {
    lines.push(tr("⚠️ В реальной ситуации с такими словами: выслушать, не обещать тайну и сразу привлечь школьного психолога и ответственных взрослых."));
  } else if (LANG === "kk") {
    const eo = EGO_ORIGINAL[dom];
    const to = TYPE_ORIGINAL[student.mbti];
    if (eo.motivate.length) lines.push(`${ego.name}: ${pickOf(eo.motivate)}`);
    if (eo.say.length) lines.push(`💬 ${pickOf(eo.say)}`);
    if (to.plus.length) lines.push(`${student.mbti}: ${pickOf(to.plus)}`);
  } else {
    lines.push(tr("Как мотивировать «{ego}»: {how}. Можно сказать: {say}", { ego: ego.name, how: pickOf(ego.motivate).toLowerCase(), say: pickOf(ego.say) }));
    lines.push(tr("Для типа {mbti} хорошо работает: {how}.", { mbti: student.mbti, how: pickOf(type.works).toLowerCase() }));
  }
  const o = q.event.options[chosen];
  if (o.fit < 1) lines.push(tr("Для самой ситуации решение было слабым."));
  else lines.push(tr("Подход не совпал с тем, что нужно ученику ({v}, {mbti}).", { v: ego.name, mbti: student.mbti }));
  return lines;
}

export const questionText = (q: Question, s: Student) => fmt(q.event.text, s);
