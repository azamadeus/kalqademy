import { EGO, EGO_ORDER } from "../data/ego";
import { EVENTS, type EventOption, type GameEvent } from "../data/events";
import { familyById } from "../data/world";
import { clamp, hashStr, mulberry32 } from "./rng";
import type {
  CaseState,
  EgoKey,
  Judgement,
  LastTurn,
  Letter,
  Quality,
  Stage,
  Student,
  Tactic,
  Tone,
} from "./types";

export const TOTAL_WEEKS = 12;
export const GRANT_LINE = 100;
export const MAX_SCORE = 140;

export const STAGES: { id: Stage; name: string; from: number; icon: string; hint: string }[] = [
  { id: "meet", name: "Знакомство", from: 1, icon: "👋", hint: "Первый контакт, адаптация к курсу" },
  { id: "diagnose", name: "Диагностика", from: 3, icon: "🔍", hint: "Понять ученика: тип, эго-состояние, семья" },
  { id: "trust", name: "Доверие", from: 5, icon: "🤝", hint: "Выстроить отношения, закрывать уязвимости" },
  { id: "work", name: "Работа", from: 8, icon: "🚀", hint: "Рост баллов и устойчивость к стрессу" },
  { id: "exam", name: "ЕНТ", from: 12, icon: "🏁", hint: "Финиш: тревога, режим, вера в себя" },
];

export const stageOf = (week: number): Stage => {
  let s: Stage = "meet";
  for (const st of STAGES) if (week >= st.from) s = st.id;
  return s;
};

export const closenessLevel = (trust: number): 0 | 1 | 2 | 3 =>
  trust >= 75 ? 3 : trust >= 50 ? 2 : trust >= 25 ? 1 : 0;

/** Weighted average of tactic affinity across the student's ego mix. */
export function egoAffinity(student: Student, tactic: Tactic): number {
  const total = EGO_ORDER.reduce((a, k) => a + student.ego[k], 0) || 1;
  return EGO_ORDER.reduce((a, k) => a + (student.ego[k] / total) * EGO[k].tactic[tactic], 0);
}

const LETTER_TACTIC: Record<Letter, Partial<Record<Tactic, number>>> = {
  I: { space: 1, listen: 0.5, play: -0.5 },
  E: { play: 0.5, goal: 0.5, space: -0.5 },
  S: { plan: 1, goal: -0.5 },
  N: { goal: 1, plan: -0.5 },
  T: { challenge: 1, plan: 0.5, listen: -0.5 },
  F: { listen: 1, challenge: -1 },
  J: { plan: 1, space: -0.5 },
  P: { play: 1, plan: -1, space: 0.5 },
};

export const letterTactic = (l: Letter, tactic: Tactic): number => LETTER_TACTIC[l]?.[tactic] ?? 0;

export const letterAffinity = (mbti: string, tactic: Tactic): number =>
  (mbti.split("") as Letter[]).reduce((a, l) => a + (LETTER_TACTIC[l]?.[tactic] ?? 0), 0);

export const dominantEgo = (student: Student): EgoKey =>
  EGO_ORDER.slice().sort((a, b) => student.ego[b] - student.ego[a])[0];

/** How well a tactic suits the person (ignoring the situation). */
export const styleScore = (student: Student, tactic: Tactic) =>
  egoAffinity(student, tactic) * 3 + letterAffinity(student.mbti, tactic) * 2;

export function preferredWarmth(student: Student, trust = 0): number {
  const total = EGO_ORDER.reduce((a, k) => a + student.ego[k], 0) || 1;
  let w = 1.5;
  for (const k of EGO_ORDER) w += (student.ego[k] / total) * EGO[k].warmth * 2;
  const l = student.mbti.split("");
  if (l[0] === "I") w -= 0.4;
  if (l[0] === "E") w += 0.4;
  if (l[2] === "F") w += 0.5;
  if (l[2] === "T") w -= 0.4;
  w += (trust / 100) * 0.6;
  return clamp(w, 0, 3);
}

export function bestTone(student: Student, trust = 0): Tone {
  return Math.round(clamp(preferredWarmth(student, trust), 0, 3)) as Tone;
}

export function topTactics(student: Student, n = 2): Tactic[] {
  const all: Tactic[] = ["listen", "plan", "goal", "challenge", "space", "family", "play"];
  return all.sort((a, b) => styleScore(student, b) - styleScore(student, a)).slice(0, n);
}

export interface Scored {
  raw: number;
  quality: Quality;
  judge: Judgement;
  intrusive: boolean;
  tooCold: boolean;
  dTrust: number;
  dMotivation: number;
  dStress: number;
  dKnowledge: number;
  fit: number;
  style: number;
  toneFit: number;
}

export function qualityOf(raw: number): Quality {
  return raw >= 11 ? "great" : raw >= 5 ? "good" : raw >= 0 ? "meh" : "bad";
}

export function scoreChoice(
  student: Student,
  trust: number,
  option: EventOption,
  tone: Tone,
  planBonus = 0,
): Scored {
  const level = closenessLevel(trust);
  const pref = preferredWarmth(student, trust);
  const toneFit = 1 - Math.min(2, Math.abs(tone - pref));
  const style = styleScore(student, option.tactic);
  const fit = option.fit * 2;
  const raw = fit + style + toneFit * 4 - 3 + planBonus;
  const sensitiveType = student.mbti[0] === "I" || student.mbti[2] === "T";
  const intrusive = tone - level >= 2 && (tone === 3 || sensitiveType);
  const tooCold = level >= 2 && tone === 0;
    let dTrust = Math.round(raw * 0.95) + (qualityOf(raw) === "great" ? 1 : 0);
  if (intrusive) dTrust -= sensitiveType ? 6 : 4;
  if (tooCold) dTrust -= 3;
  dTrust = clamp(dTrust, -16, 12);
  const dMotivation = clamp(Math.round(raw * 0.6), -10, 9);
  const dStress = clamp(Math.round(-raw * 0.6) + (intrusive ? 2 : 0), -10, 9);
  const dKnowledge = clamp(Math.round(raw * 0.18), -2, 3);
  return {
    raw,
    quality: qualityOf(raw),
    judge: { situation: option.fit >= 1, style: style >= 1, tone: toneFit >= 0 && !intrusive && !tooCold },
    intrusive,
    tooCold,
    dTrust,
    dMotivation,
    dStress,
    dKnowledge,
    fit: option.fit,
    style,
    toneFit,
  };
}

export function whyLines(student: Student, s: Scored, tactic: Tactic, tone: Tone, blind: boolean): string[] {
  const lines: string[] = [];
  lines.push(s.judge.situation ? "Решение подходит самой ситуации." : "Для самой ситуации решение было слабым.");
  if (blind) {
    lines.push(s.judge.style ? "Подход попал в склад ученика." : "Подход плохо ложится на склад ученика.");
  } else {
    const ego = EGO[dominantEgo(student)];
    lines.push(
      s.judge.style
        ? `Подход совпал с тем, что нужно ученику (${ego.name}, ${student.mbti}).`
        : `Подход не совпал с тем, что нужно ученику (${ego.name}, ${student.mbti}).`,
    );
  }
  if (s.intrusive) lines.push("Тон оказался слишком близким для текущих отношений: ученик почувствовал давление.");
  else if (s.tooCold) lines.push("Тон оказался слишком холодным для сложившихся отношений.");
  else if (s.judge.tone) lines.push("Тон общения попал в ожидания ученика.");
  else lines.push(tone > preferredWarmth(student) ? "Тон был теплее, чем нужно этому ученику." : "Тон был холоднее, чем нужно этому ученику.");
  void tactic;
  return lines;
}

export function pickEvent(student: Student, c: CaseState): GameEvent {
  const stage = stageOf(c.week);
  if (c.week === 1) return EVENTS.find((e) => e.id === "first-message")!;
  let pool = EVENTS.filter((e) => e.stages.includes(stage) && !c.doneEvents.includes(e.id));
  if (c.week === TOTAL_WEEKS) {
    const eve = pool.find((e) => e.id === "eve");
    if (eve) return eve;
  }
  if (!pool.length) pool = EVENTS.filter((e) => !c.doneEvents.includes(e.id));
  if (!pool.length) pool = EVENTS;
  const fam = familyById(student.familyId);
  const ego = dominantEgo(student);
  const letters = student.mbti.split("") as Letter[];
  const weights = pool.map((e) => {
    let w = 1;
    if (e.prone?.ego?.includes(ego)) w += 1.5;
    w += (e.prone?.letters?.filter((l) => letters.includes(l)).length ?? 0) * 0.7;
    if (fam.boosts.includes(e.problem)) w += 1;
    return w;
  });
  const rng = mulberry32(student.seed + c.week * 7919 + hashStr(stage));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function finalScoreOf(student: Student, c: CaseState): number {
  const v = student.mock + c.knowledge + (c.motivation - 50) / 5 - Math.max(0, c.stress - 55) / 5;
  return clamp(Math.round(v), 20, MAX_SCORE);
}

export const makeLast = (
  eventId: string,
  tactic: Tactic,
  tone: Tone,
  s: Scored,
  why: string[],
): LastTurn => ({
  eventId,
  tactic,
  tone,
  quality: s.quality,
  judge: s.judge,
  dTrust: s.dTrust,
  dMotivation: s.dMotivation,
  dStress: s.dStress,
  dKnowledge: s.dKnowledge,
  intrusive: s.intrusive,
  tooCold: s.tooCold,
  why,
});
