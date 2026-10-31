import { EVENTS, type GameEvent } from "../data/events";
import { familyById } from "../data/world";
import { EGO, EGO_ORDER } from "../data/ego";
import { TYPES } from "../data/mbti";
import { dominantEgo, woundOf } from "../game/engine";
import { WOUNDS, WOUND_ORDER } from "../data/wounds";
import { woundPhrasesOf } from "../data/phrases";
import { BANS, DRIVERS, driversOf, pick } from "../data/drivers";
import { mulberry32 } from "../game/rng";
import { fmt } from "../game/text";
import type { Student, Tactic } from "../game/types";
import { LANG, tr } from "../i18n";
import { EGO_ORIGINAL } from "./original-kk";
import { NEGATIVE, POSITIVE, featName, replyOf, type Feat } from "./features";
import { needVector, needsOf, type Need } from "./needs";
import { ATTENTIONS, POSITIONS, ROLES, SCRIPTS, label, taProfileOf } from "./profile";
import { TAGS } from "./tags";

export const QUIZ_LENGTH = 10;
/** How many of the questions are the student's own words (their fears and beliefs) rather than a prepared situation. */
const VOICE_QUESTIONS = 3;
/** Questions where the learner names the sensitive theme from body language and behaviour. */
const THEME_QUESTIONS = 2;
/** Options within this many points of the best one count as equally right. */
const TIE = 0.3;
/** A question is only used when the best option leads the runner-up by at least this much. */
const MARGIN = 0.8;
/** No tactic may be the right answer more than this many times in one quiz. */
const TACTIC_CAP = 4;

export interface Question {
  event: GameEvent;
  /** Features of every option (see features.ts). */
  tags: Feat[][];
  /** Indices of options that count as correct. */
  right: number[];
}

export const isTheme = (q: Question) => q.event.id.startsWith("theme-");
export const isVoice = (q: Question) => q.event.id.startsWith("voice-");

const cache = new WeakMap<Student, { needs: Need[]; v: Partial<Record<Feat, number>> }>();
export function profileOf(s: Student) {
  let p = cache.get(s);
  if (!p) {
    const needs = needsOf(s);
    p = { needs, v: needVector(needs) };
    cache.set(s, p);
  }
  return p;
}

/** Situation fit plus how well the answer's features match what the materials say this student needs. */
function scoresOf(student: Student, event: GameEvent, tags: Feat[][]): number[] {
  if (event.serious) return event.options.map((o) => o.fit * 10);
  const { v } = profileOf(student);
  return event.options.map((o, i) => {
    const t = tags[i];
    const need = t.reduce((a, f) => a + (v[f] ?? 0), 0) / Math.sqrt(Math.max(1, t.length));
    return o.fit * 2 + need * 1.5 - (o.fit < 0 ? 6 : 0);
  });
}

function rightOptions(student: Student, event: GameEvent, tags: Feat[][]): number[] | null {
  const s = scoresOf(student, event, tags);
  const top = Math.max(...s);
  const sorted = s.slice().sort((a, b) => b - a);
  if (sorted.length > 1 && sorted[0] - sorted[1] < MARGIN && sorted[0] - sorted[1] >= TIE) return null;
  return s.map((x, i) => (top - x <= TIE ? i : -1)).filter((i) => i >= 0);
}

const TACTIC_OF: Record<Feat, Tactic> = { l: "listen", w: "listen", f: "listen", a: "listen", s: "plan", g: "plan", q: "plan", n: "plan", m: "goal", c: "goal", h: "challenge", X: "challenge", D: "challenge", O: "challenge", T: "challenge", e: "space", V: "space", p: "play", r: "listen" };

/** The student's own words: what the type fears, what the ego state believes, what the sensitive theme says. */
function voiceLines(student: Student): string[] {
  const ego = EGO[dominantEgo(student)];
  const lines = [TYPES[student.mbti].fearVoice, ...ego.beliefs.slice(0, 2), WOUNDS[woundOf(student)].voice];
  return lines.map((l) => fmt(l, student));
}

/** A question built from the student's inner voice; the answers are made of the replies for the features the materials name. */
function voiceQuestion(student: Student, line: string, n: number, rng: () => number, short = false): Question | null {
  const { v } = profileOf(student);
  const pos = POSITIVE.slice().sort((a, b) => (v[b] ?? 0) - (v[a] ?? 0));
  const bad = NEGATIVE.slice().sort((a, b) => (v[a] ?? 0) - (v[b] ?? 0));
  const best = pos[n % 2];
  const second = pos[2 + (n % 2)];
  const mismatched = pos.slice().reverse();
  const sets: Feat[][] = short ? [[best], [mismatched[0]], [mismatched[2]], [bad[0]]] : [[best, second], [mismatched[0], mismatched[1]], [mismatched[2]], [bad[0]]];
  const order = [0, 1, 2, 3].sort(() => rng() - 0.5);
  const tags = order.map((k) => sets[k]);
  const options = tags.map((t) => ({ tactic: TACTIC_OF[t[0]], text: t.map(replyOf).join(" "), fit: 0 }));
  const event: GameEvent = { id: `voice-${n}`, title: tr("Внутренний голос"), problem: "anxiety", stages: [], text: line, stress: 0, options };
  const right = rightOptions(student, event, tags);
  return right && right.length === 1 ? { event, tags, right } : null;
}

/** "Which sensitive theme is it?": the learner reads body language and behaviour and chooses. */
function themeQuestion(student: Student, n: number, rng: () => number): Question {
  const right = woundOf(student);
  const w = WOUNDS[right];
  const others = WOUND_ORDER.filter((k) => k !== right).sort(() => rng() - 0.5).slice(0, 3);
  const order = [right, ...others].sort(() => rng() - 0.5);
  const says = woundPhrasesOf(right);
  const cues = [
    tr("Что видно: {v}", { v: w.pose[LANG === "kk" ? 1 : 0] }),
    n === 0 ? tr("Говорит: «{v}»", { v: fmt(says[0], student) }) : tr("Ведёт себя так: {v}", { v: w.school.charAt(0).toLowerCase() + w.school.slice(1) }),
  ].join("\n");
  const options = order.map((k) => ({ tactic: "listen" as Tactic, text: `${WOUNDS[k].emoji} ${WOUNDS[k].name}`, fit: 0 }));
  const event: GameEvent = { id: `theme-${n}`, title: tr("Какая у него чувствительная тема?"), problem: "social", stages: [], text: cues, stress: 0, options };
  return { event, tags: options.map(() => []), right: [order.indexOf(right)] };
}

/** Shuffles the answers of a question so the right one is not always where the author put it. */
function shuffled(q: Question, rng: () => number): Question {
  const order = q.event.options.map((_, i) => i).sort(() => rng() - 0.5);
  return {
    event: { ...q.event, options: order.map((i) => q.event.options[i]) },
    tags: order.map((i) => q.tags[i]),
    right: q.right.map((r) => order.indexOf(r)).sort((a, b) => a - b),
  };
}

/** A fixed set of situations for the student: the same student and attempt always give the same quiz. */
export interface QuizOptions {
  /** Only situations whose answers are at most this many characters (for phones in a live game). */
  maxChars?: number;
}

export function buildQuiz(student: Student, attempt = 0, opts: QuizOptions = {}): Question[] {
  const max = opts.maxChars ?? Infinity;
  const fits = (e: GameEvent) => e.options.every((o) => o.text.length <= max) && e.text.length <= max + 30;
  const rng = mulberry32(student.seed * 31 + attempt * 7 + 3);
  const ego = dominantEgo(student);
  const rank = (e: GameEvent) =>
    (e.prone?.ego?.includes(ego) ? 0 : 1) + (e.prone?.letters?.some((l) => student.mbti.includes(l)) ? 0 : 1) + (familyById(student.familyId).boosts.includes(e.problem) ? 0 : 1) + (e.sharp ? -1.6 : 0) + rng() * 1.6;
  const pool = EVENTS.filter((e) => e.id !== "first-message" && TAGS[e.id] && fits(e))
    .map((e) => ({ e, r: rank(e) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.e);
  const events: Question[] = [];
  const problems = new Set<string>();
  let serious = 0;
  const used: Record<string, number> = {};
  const want = QUIZ_LENGTH - VOICE_QUESTIONS - THEME_QUESTIONS;
  const first = EVENTS.find((e) => e.id === "first-message")!;
  const firstRight = fits(first) ? rightOptions(student, first, TAGS[first.id]) : null;
  if (firstRight && firstRight.length === 1) { events.push({ event: first, tags: TAGS[first.id], right: firstRight }); used[first.options[firstRight[0]].tactic] = 1; }
  for (const strict of [true, false]) {
    for (const e of pool) {
      if (events.length >= want) break;
      if (events.some((x) => x.event.id === e.id)) continue;
      if (strict && problems.has(e.problem)) continue;
      if (e.serious && serious >= 1) continue;
      const right = rightOptions(student, e, TAGS[e.id]);
      if (!right || (right.length > 1 && !e.serious)) continue;
      const tac = e.options[right[0]].tactic;
      if (strict && (used[tac] ?? 0) >= TACTIC_CAP) continue;
      used[tac] = (used[tac] ?? 0) + 1;
      problems.add(e.problem);
      if (e.serious) serious++;
      events.push({ event: e, tags: TAGS[e.id], right });
    }
  }
  const voices: Question[] = [];
  const lines = voiceLines(student);
  for (let n = 0; n < lines.length * 2 && voices.length < VOICE_QUESTIONS + (want - events.length); n++) {
    const q = voiceQuestion(student, lines[n % lines.length], n, rng, max < Infinity);
    if (q && !voices.some((x) => x.event.text === q.event.text)) voices.push(q);
  }
  // events first, with the student's own words woven in between and two theme questions near the end
  const out: Question[] = [];
  let vi = 0;
  events.forEach((q, i) => {
    out.push(q);
    if (i % 2 === 1 && vi < voices.length) out.push(voices[vi++]);
  });
  while (vi < voices.length) out.push(voices[vi++]);
  out.splice(Math.min(out.length, 4), 0, themeQuestion(student, 0, rng));
  out.push(themeQuestion(student, 1, rng));
  return out.map((q) => (isTheme(q) || isVoice(q) ? q : shuffled(q, rng)));
}

/** The statement in the materials behind a feature of this student, with whose it is. */
export function evidence(student: Student, f: Feat, sign: 1 | -1): Need | undefined {
  const cands = profileOf(student).needs.filter((n) => n.f === f && Math.sign(n.w) === sign);
  return cands.sort((a, b) => Math.abs(b.w) - Math.abs(a.w))[0];
}

/** Why the right answer was right and what was off in the chosen one, with the statements from the materials behind it. */
export function hintFor(student: Student, q: Question, chosen: number, n = 0): string[] {
  const lines: string[] = [];
  if (isTheme(q)) {
    const w = WOUNDS[woundOf(student)];
    lines.push(tr("Это тема «{name}»: {v}.", { name: w.name, v: w.signs.slice(0, 3).join("; ").toLowerCase() }));
    lines.push(tr("Язык тела: {v}", { v: w.pose[LANG === "kk" ? 1 : 0] }));
    lines.push(tr("Работает: {v}", { v: w.works.slice(0, 2).join("; ").toLowerCase() }));
    return lines;
  }
  if (q.event.serious) {
    lines.push(tr("⚠️ В реальной ситуации с такими словами: выслушать, не обещать тайну и сразу привлечь школьного психолога и ответственных взрослых."));
    return lines;
  }
  const { v } = profileOf(student);
  const rightTags = q.tags[q.right[0]];
  const good = rightTags.filter((f) => (v[f] ?? 0) > 0).sort((a, b) => (v[b] ?? 0) - (v[a] ?? 0)).slice(0, 2);
  for (const f of good) {
    const e = evidence(student, f, 1);
    if (e) lines.push(tr("✅ Подходит: {feat}. Из материалов ({who}): «{src}»", { feat: featName(f), who: e.who, src: e.src }));
  }
  const chosenTags = q.tags[chosen];
  const harm = chosenTags.filter((f) => (v[f] ?? 0) < 0).sort((a, b) => (v[a] ?? 0) - (v[b] ?? 0)).slice(0, 2);
  for (const f of harm) {
    const e = evidence(student, f, -1);
    if (e) lines.push(tr("❌ В вашем ответе: {feat}. Из материалов ({who}): «{src}»", { feat: featName(f), who: e.who, src: e.src }));
  }
  if (!harm.length) {
    const missing = rightTags.filter((f) => !chosenTags.includes(f) && (v[f] ?? 0) > 0).sort((a, b) => (v[b] ?? 0) - (v[a] ?? 0))[0];
    const e = missing && evidence(student, missing, 1);
    if (e) lines.push(tr("❌ Не хватало: {feat}. Из материалов ({who}): «{src}»", { feat: featName(missing), who: e.who, src: e.src }));
  }
  if (q.event.options[chosen].fit < 1 && q.event.options[chosen].fit !== 0) lines.push(tr("Для самой ситуации решение было слабым."));
  const main = driversOf(student.mbti).drivers[0];
  if (main && n % 2 === 0) lines.push(tr("Главный драйвер «{name}». Что помогает: {v}.", { name: pick(DRIVERS[main].name), v: pick(DRIVERS[main].permission).toLowerCase() }));
  return lines;
}

export const questionText = (q: Question, s: Student) => fmt(q.event.text, s);

/** A short cheat sheet on the student: what works and what to avoid, from type, egogram and sensitive theme. */
export function analysisOf(student: Student): string[] {
  const type = TYPES[student.mbti];
  const ranked = EGO_ORDER.slice().sort((x, y) => student.ego[y] - student.ego[x]);
  const top = ranked.slice(0, 2);
  const low = ranked[ranked.length - 1];
  const w = WOUNDS[woundOf(student)];
  const kk = LANG === "kk";
  const ta = taProfileOf(student);
  const motivate = (k: (typeof EGO_ORDER)[number]) => (kk && EGO_ORIGINAL[k].motivate[0]) || EGO[k].motivate[0];
  return [
    tr("Тип: {v}", { v: `${student.mbti} «${type.nick}»` }),
    tr("Эго-состояния: {v}", { v: `${top.map((k) => `${EGO[k].emoji} ${EGO[k].name} ${student.ego[k]}`).join(", ")}; ${EGO[low].emoji} ${EGO[low].name} ${student.ego[low]}` }),
    tr("Чувствительная тема: {name}", { name: `${w.emoji} ${w.name}` }),
    tr("Язык тела: {v}", { v: w.pose[kk ? 1 : 0] }),
    tr("Драйверы: {v}", { v: driversOf(student.mbti).drivers.map((d) => pick(DRIVERS[d].name)).join(", ") }),
    tr("Запреты: {v}", { v: driversOf(student.mbti).bans.map((b) => pick(BANS[b])).join("; ") }),
    tr("Профиль в ТА: {v}", { v: [label(POSITIONS[ta.position].name), label(SCRIPTS[ta.script].name), label(ROLES[ta.role].name), label(ATTENTIONS[ta.attention].name)].join("; ") }),
    tr("Работает: {v}", { v: [type.works[0], motivate(top[0]), w.works[0]].map((x) => x.replace(/\.$/, "").toLowerCase()).join("; ") }),
    tr("Практика для развития: {v}", { v: EGO[top[0]].exercises[0] }),
    tr("Избегать: {v}", { v: [type.avoids[0], EGO[top[0]].avoid[0], w.avoids[0]].map((x) => x.replace(/\.$/, "").toLowerCase()).join("; ") }),
  ];
}
