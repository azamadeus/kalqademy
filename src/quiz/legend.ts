import { EGO, EGO_ORDER } from "../data/ego";
import { TYPES } from "../data/mbti";
import { courseById, familyById, goalById } from "../data/world";
import { WOUNDS } from "../data/wounds";
import { dominantEgo, woundOf } from "../game/engine";
import { fmt } from "../game/text";
import type { Student } from "../game/types";
import { LANG, tr } from "../i18n";
import type { EgoKey } from "../game/types";
import { phrasesOf, woundPhrasesOf } from "../data/phrases";
import { BANS, DRIVERS, driversOf, pick } from "../data/drivers";
import { EGO_ORIGINAL, TYPE_ORIGINAL } from "./original-kk";
import { TYPE_PDF } from "./pdf-kk";

export interface EgoRow { key: EgoKey; name: string; emoji: string; color: string; value: number; level: "high" | "mid" | "low"; text: string }

export interface Legend {
  title: string;
  egogram: EgoRow[];
  sections: { icon: string; head: string; lines: string[]; fold?: boolean }[];
}

const list = (a: string[], n: number) => a.slice(0, n).join("; ");
const firstSentence = (x: string) => { const m = x.match(/^.{40,}?[.!?](\s|$)/); return (m ? m[0] : x).trim(); };
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * The student's backstory, built from the type, ego-state, family, course and goal data.
 * Only behaviour, feelings and circumstances are used, never appearance. In the Kazakh version the
 * type and ego-state wording comes from the original ALQA texts.
 */
export function legendOf(s: Student): Legend {
  const t = TYPES[s.mbti];
  const dom = dominantEgo(s);
  const ego = EGO[dom];
  const w = WOUNDS[woundOf(s)];
  const goal = goalById(s.goalId);
  const fam = familyById(s.familyId);
  const course = courseById(s.courseId);
  const f = (x: string) => fmt(x, s);
  const kk = LANG === "kk";
  const to = TYPE_ORIGINAL[s.mbti];
  const eo = EGO_ORIGINAL[dom];

  const aboutKk = to.about.filter((l) => l.length > 45 && !l.endsWith(":")).slice(0, 2);
  const character = kk && aboutKk.length ? aboutKk : [t.summary, tr("Важно для него: {v}", { v: lower(t.motives).replace(/\.$/, "") })];
  const strengths = t.studentPlus.slice(0, 3);
  const hard = t.studentMinus.slice(0, 3);
  const fears = kk && to.fears.length ? to.fears.slice(0, 3) : t.fears.slice(0, 3);
  const beliefs = kk && eo.fears.length ? eo.fears.slice(0, 2) : ego.beliefs.slice(0, 2);
  const scenarios = kk && eo.problems.length ? eo.problems.slice(0, 2) : ego.syndromes.slice(0, 2);

  const egogram: EgoRow[] = EGO_ORDER.map((k) => {
    const value = s.ego[k];
    const level = value >= 58 ? "high" : value <= 30 ? "low" : "mid";
    const hi = LANG === "kk" && EGO_ORIGINAL[k].about ? firstSentence(EGO_ORIGINAL[k].about) : EGO[k].signs[0];
    return { key: k, name: EGO[k].name, emoji: EGO[k].emoji, color: EGO[k].color, value, level, text: level === "high" ? hi : level === "low" ? EGO[k].low : "" };
  });
  const pdf = TYPE_PDF[s.mbti] ?? {};
  const part = (keys: (keyof typeof pdf)[]) => keys.map((k) => pdf[k]).filter((x): x is string => !!x);
  const fold = (icon: string, head: string, lines: string[]) => (lines.length ? [{ icon, head, lines, fold: true }] : []);
  const note = LANG === "kk" ? [] : [tr("Оригинал ALQA на казахском языке")];
  const extra = [
    ...fold("🎨", tr("Что любит: хобби и интересы"), [...note, ...part(["hobby"])]),
    ...fold("🎭", tr("Роли и как его видят другие"), [...note, ...part(["roles"])]),
    ...fold("⚖️", tr("Сильные и слабые стороны типа"), [...note, ...part(["traits"])]),
    ...fold("📊", tr("Эго-состояния типа (слайд ALQA)"), [...note, ...part(["ego"])]),
    ...fold("🔺", tr("Треугольник Карпмана"), [...note, ...part(["karpman"])]),
    ...fold("🧒", tr("Типичная история: детство и семья"), [...note, ...part(["childhood", "parents"])]),
    ...fold("🔗", tr("Драйверы и запреты"), [...note, ...part(["drivers"])]),
    ...fold("🏫", tr("Школьные годы"), [...note, ...part(["school", "strong", "weak"])]),
    ...fold("⚠️", tr("Возможные психологические проблемы"), [...note, ...part(["problems"])]),
    ...fold("😨", tr("Страхи"), [...note, ...part(["fears"])]),
    ...fold("🪞", tr("Самооценка"), [...note, ...part(["self"])]),
    ...fold("🧭", tr("Рекомендации ALQA для развития"), [...note, ...part(["advice"])]),
  ].filter((x) => x.lines.length > note.length);
  return {
    title: tr("{name}, {age}, {city}", { name: s.name, age: s.age, city: s.city }),
    egogram,
    sections: [
      { icon: "👤", head: tr("Характер"), lines: character },
      { icon: goal.icon, head: tr("Мечта"), lines: [`${goal.profession} · ${goal.uni}`, goal.subjects] },
      { icon: "📚", head: tr("Учёба"), lines: [
        tr("Сильные стороны: {v}", { v: list(strengths, 3) }),
        tr("Сложности: {v}", { v: list(hard, 3) }),
        tr("Привычные трудности: {v}", { v: list(t.problems, 3) }),
        ...(kk && to.plus.length ? [`✅ Ынталандырады: ${list(to.plus, 2)}`] : []),
        ...(kk && to.minus.length ? [`❌ Ынталандырмайды: ${list(to.minus, 2)}`] : []),
        tr("🎓 Старт на пробнике: {mock}", { mock: s.mock }),
      ] },
      ...extra,
      { icon: fam.icon, head: tr("Семья и курс"), lines: [fam.label, f(fam.voice), `💳 ${course.name} · ${course.price}`, f(course.voice), ego.desc] },
      { icon: "🌀", head: tr("Тараканы в голове"), lines: [
        f(t.fearVoice),
        tr("Боится: {v}", { v: list(fears, 3) }),
        ...beliefs,
        tr("Привычные сценарии: {v}", { v: list(scenarios, 2) }),
      ] },
      { icon: "🎛️", head: tr("Драйверы и запреты типа"), lines: [
        ...driversOf(s.mbti).drivers.map((d, i) => `${i === 0 ? "★ " : ""}${pick(DRIVERS[d].name)}: ${pick(DRIVERS[d].shows)}. «${f(pick(DRIVERS[d].says[0]))}»`),
        tr("Запреты: {v}", { v: driversOf(s.mbti).bans.map((b) => pick(BANS[b])).join("; ") }),
      ] },
      { icon: w.emoji, head: tr("Чувствительная тема: {name}", { name: w.name }), lines: [
        w.theme,
        f(w.voice),
        tr("Маска: {v}", { v: w.strategy }),
        tr("Боится: {v}", { v: lower(w.fear).replace(/\.$/, "") }),
        tr("В школе: {v}", { v: lower(w.school) }),
        tr("Как это проявляется: {v}", { v: list(w.signs, 3) }),
      ] },
      { icon: "💬", head: tr("Любимые слова и фразы"), lines: [...phrasesOf(s.mbti).slice(0, 3), ...driverSays(s.mbti).slice(0, 2), ...woundPhrasesOf(woundOf(s)).slice(0, 2)].map((x) => `«${f(x)}»`) },
    ],
  };
}

/** Phrases of the type's main drivers in the current language. */
export const driverSays = (mbti: string): string[] => driversOf(mbti).drivers.slice(0, 2).flatMap((d) => DRIVERS[d].says.map(pick));
