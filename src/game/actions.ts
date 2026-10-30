import { EGO } from "../data/ego";
import { eventById } from "../data/events";
import { GUARDED, questionById } from "../data/questions";
import { EVENT_POST, EVENT_PRE, INTRUSIVE, LETTER_MINUS, LETTER_PLUS, REPLY, TOO_COLD } from "../data/voices";
import { ACHIEVEMENTS, emptyCurator, levelOf, questionsPerWeek } from "./career";
import {
  TOTAL_WEEKS,
  closenessLevel,
  dominantEgo,
  finalScoreOf,
  letterTactic,
  makeLast,
  pickEvent,
  scoreChoice,
  stageOf,
  STAGES,
  whyLines,
} from "./engine";
import { familyById } from "../data/world";
import { clamp, hashStr, mulberry32, pick } from "./rng";
import { evaluateReport } from "./report";
import { ivSource } from "../data/workbooks";
import { evaluatePlan, planBonusFor, planCovers } from "./plan";
import { TACTICS, fmt, toneWrap } from "./text";
import type {
  CaseState,
  GameState,
  Hypothesis,
  Letter,
  Msg,
  Plan,
  ReportInput,
  SkillKey,
  Student,
  Tone,
} from "./types";

export const VERSION = 2;

export const newGame = (): GameState => ({
  version: VERSION,
  curator: emptyCurator(),
  students: [],
  cases: {},
  achievements: [],
  seq: 1,
});

const XP_BY_QUALITY = { great: 14, good: 9, meh: 4, bad: 1 } as const;
const SKILL_BY_QUALITY = { great: 3, good: 2, meh: 1, bad: 0 } as const;

function push(c: CaseState, from: Msg["from"], text: string, tone?: Tone): CaseState {
  const id = c.msgSeq + 1;
  return { ...c, msgSeq: id, log: [...c.log, { id, from, text, tone }] };
}

function giveXp(g: GameState, xp: number, skills: Partial<Record<SkillKey, number>> = {}): GameState {
  const s = { ...g.curator.skills };
  for (const k of Object.keys(skills) as SkillKey[]) s[k] += skills[k] ?? 0;
  return { ...g, curator: { ...g.curator, xp: g.curator.xp + xp, skills: s } };
}

function rollEvent(student: Student, c: CaseState): CaseState {
  const ev = pickEvent(student, c);
  const rng = mulberry32(student.seed * 31 + c.week * 131 + hashStr(ev.id));
  const ego = dominantEgo(student);
  const pre = pick(rng, EVENT_PRE[ego]);
  const post = pick(rng, EVENT_POST[ego]);
  const stage = STAGES.find((s) => s.id === stageOf(c.week))!;
  let next: CaseState = {
    ...c,
    eventId: ev.id,
    acted: false,
    last: null,
    stress: clamp(c.stress + Math.round(ev.stress * 0.5)),
  };
  next = push(next, "system", `📅 Неделя ${c.week} из ${TOTAL_WEEKS} · ${stage.icon} ${stage.name}`);
  next = push(next, "student", fmt(`${pre}${ev.text}${post}`, student));
  if (ev.serious) next = push(next, "system", "⚠️ Серьёзный сигнал. В реальной ситуации немедленно сообщите школьному психологу и администрации; не обещайте хранить такое в тайне.");
  return next;
}

export function startCase(student: Student, level: number): CaseState {
  const fam = familyById(student.familyId);
  const base: CaseState = {
    studentId: student.id,
    week: 1,
    trust: clamp(18 + (fam.stress < 0 ? 6 : 0) + (student.seed % 7)),
    motivation: clamp(50 + ((student.seed >> 3) % 15) - 5),
    stress: clamp(28 + fam.stress * 2),
    knowledge: 0,
    revealed: [],
    asked: [],
    eventId: null,
    acted: false,
    doneEvents: [],
    log: [],
    questionsLeft: questionsPerWeek(level),
    hypothesis: { letters: {} },
    last: null,
    tones: [],
    finished: false,
    finalScore: null,
    reports: [],
    msgSeq: 0,
  };
  const intro = push(
    base,
    "system",
    fmt(`🎓 ${student.name} записан{а} на курс и закреплён{а} за вами. Ваша задача: за ${TOTAL_WEEKS} недель подготовить ученика к ЕНТ.`, student),
  );
  return rollEvent(student, intro);
}

export function addStudent(g: GameState, student: Student): GameState {
  if (g.students.some((s) => s.id === student.id)) return g;
  const level = levelOf(g.curator.xp).level;
  return {
    ...g,
    students: [...g.students, student],
    cases: { ...g.cases, [student.id]: startCase(student, level) },
  };
}

export function removeStudent(g: GameState, id: string): GameState {
  const cases = { ...g.cases };
  delete cases[id];
  return { ...g, students: g.students.filter((s) => s.id !== id), cases };
}

const sget = (g: GameState, id: string) => g.students.find((s) => s.id === id)!;

function putCase(g: GameState, c: CaseState): GameState {
  return { ...g, cases: { ...g.cases, [c.studentId]: c } };
}

export function ask(g: GameState, studentId: string, qid: string): GameState {
  const student = sget(g, studentId);
  let c = g.cases[studentId];
  const q = questionById(qid);
  if (!q || c.questionsLeft <= 0 || c.asked.includes(qid) || c.finished) return g;
  const level = closenessLevel(c.trust);
  c = push(c, "curator", fmt(q.text, student));
  const guarded = level < q.needs;
  c = push(c, "student", fmt(guarded ? GUARDED : q.answer(student), student));
  c = { ...c, questionsLeft: c.questionsLeft - 1 };
  if (guarded) {
    c = { ...c, trust: clamp(c.trust - 2), last: c.last };
    return giveXp(putCase(g, c), 0);
  }
  c = { ...c, asked: [...c.asked, qid] };
  return giveXp(putCase(g, c), 1, { diagnostics: 1 });
}

export function act(g: GameState, studentId: string, optionIndex: number, tone: Tone): GameState {
  const student = sget(g, studentId);
  let c = g.cases[studentId];
  if (c.acted || c.finished || !c.eventId) return g;
  const ev = eventById(c.eventId);
  if (!ev) return g;
  const option = ev.options[optionIndex];
  const iv = planCovers(c.plan, stageOf(c.week), ev.problem);
  const planBonus = iv && c.planResult ? planBonusFor(c.planResult.score) * (iv.tactic === option.tactic ? 1 : 0.4) : 0;
  const s = scoreChoice(student, c.trust, option, tone, planBonus);
  const rng = mulberry32(student.seed * 17 + c.week * 53 + optionIndex);
  const ego = dominantEgo(student);
  let reply = fmt(pick(rng, REPLY[ego][s.quality]), student);
  const letters = student.mbti.split("") as Letter[];
  let bestL: Letter | null = null;
  let bestV = 0;
  for (const l of letters) {
    const v = Math.abs(letterTactic(l, option.tactic));
    if (v > bestV) { bestV = v; bestL = l; }
  }
  if (bestL) {
    const w = letterTactic(bestL, option.tactic);
    if (w > 0 && (s.quality === "great" || s.quality === "good")) reply += " " + LETTER_PLUS[bestL];
    if (w < 0 && (s.quality === "bad" || s.quality === "meh")) reply += " " + LETTER_MINUS[bestL];
  }
  if (s.intrusive) reply += " " + INTRUSIVE;
  else if (s.tooCold) reply += " " + TOO_COLD;
  const why = whyLines(student, s, option.tactic, tone, student.blind);
  if (iv && planBonus > 0) why.push(`📋 План сработал: заранее подготовлен приём «${iv.title}» (${ivSource(iv)}).`);
  c = push(c, "curator", toneWrap(tone, fmt(option.text, student)), tone);
  c = push(c, "student", reply);
  c = {
    ...c,
    trust: clamp(c.trust + s.dTrust),
    motivation: clamp(c.motivation + s.dMotivation),
    stress: clamp(c.stress + s.dStress),
    knowledge: c.knowledge + s.dKnowledge,
    acted: true,
    doneEvents: [...c.doneEvents, ev.id],
    tones: [...c.tones, tone],
    last: { ...makeLast(ev.id, option.tactic, tone, s, why), planned: iv && planBonus > 0 ? iv.title : null },
  };
  const skill = TACTICS[option.tactic].skill as SkillKey;
  return giveXp(putCase(g, c), XP_BY_QUALITY[s.quality], { [skill]: SKILL_BY_QUALITY[s.quality] });
}

export function advance(g: GameState, studentId: string): GameState {
  const student = sget(g, studentId);
  let c = g.cases[studentId];
  if (!c.acted || c.finished) return g;
  const level = levelOf(g.curator.xp).level;
  if (c.week >= TOTAL_WEEKS) {
    const score = finalScoreOf(student, c);
    c = push({ ...c, finished: true, finalScore: score, eventId: null }, "system", `🏁 ЕНТ сдан! Итог: ${score} баллов из 140.`);
    const students = g.students.map((s) => (s.id === studentId ? { ...s, blind: false } : s));
    const bonus = 20 + Math.round(score / 4);
    const g2 = giveXp({ ...putCase(g, c), students, curator: { ...g.curator, casesFinished: g.curator.casesFinished + 1 } }, bonus);
    return g2;
  }
  const fam = familyById(student.familyId);
  const drift = EGO[dominantEgo(student)].drift;
  const study = Math.round(0.3 + (c.motivation / 100) * 1.7 - Math.max(0, c.stress - 70) / 20);
  c = {
    ...c,
    week: c.week + 1,
    knowledge: c.knowledge + study,
    stress: clamp(c.stress + Math.round(drift.stress * 0.5 + fam.stress * 0.4) - 2),
    motivation: clamp(c.motivation + drift.motivation + (c.trust > 60 ? 1 : 0)),
    questionsLeft: questionsPerWeek(level),
  };
  return putCase(g, rollEvent(student, c));
}

export function useIntuition(g: GameState, studentId: string): GameState {
  const student = sget(g, studentId);
  const c = g.cases[studentId];
  if (levelOf(g.curator.xp).level < 3 || c.revealed.includes("used")) return g;
  const keys = ["EI", "SN", "TF", "JP"].filter((k) => !c.revealed.includes(k));
  if (!keys.length) return g;
  const rng = mulberry32(student.seed + c.week);
  const k = pick(rng, keys);
  return putCase(g, { ...c, revealed: [...c.revealed, k, "used"] });
}

export function setHypothesis(g: GameState, studentId: string, h: Hypothesis): GameState {
  return putCase(g, { ...g.cases[studentId], hypothesis: h });
}

export function submitReport(g: GameState, studentId: string, input: ReportInput): GameState {
  const student = sget(g, studentId);
  const c = g.cases[studentId];
  const r = evaluateReport(student, c, input, g.seq);
  const next = putCase({ ...g, seq: g.seq + 1 }, { ...c, reports: [...c.reports, r] });
  return giveXp(next, r.xp, { diagnostics: Math.ceil(r.score / 20) });
}

export function submitPlan(g: GameState, studentId: string, plan: Plan): GameState {
  const student = sget(g, studentId);
  const c = g.cases[studentId];
  const r = evaluatePlan(student, c, plan, g.seq, !student.blind || c.finished);
  const withMsg = { ...r, studentMessage: fmt(r.studentMessage, student) };
  let next = putCase({ ...g, seq: g.seq + 1 }, { ...c, plan, planResult: withMsg });
  next = giveXp(next, r.xp, { structure: 2, diagnostics: 1 });
  return next;
}

export function checkAchievements(g: GameState): { g: GameState; fresh: string[] } {
  const fresh = ACHIEVEMENTS.filter((a) => !g.achievements.includes(a.id) && a.check(g)).map((a) => a.id);
  if (!fresh.length) return { g, fresh };
  return { g: { ...g, achievements: [...g.achievements, ...fresh] }, fresh };
}
