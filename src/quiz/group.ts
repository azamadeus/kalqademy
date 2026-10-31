import { EGO, EGO_ORDER } from "../data/ego";
import { BANS, DRIVERS, driversOf, pick } from "../data/drivers";
import { WOUNDS } from "../data/wounds";
import { TYPES } from "../data/mbti";
import { courseById, familyById, goalById } from "../data/world";
import { dominantEgo, woundOf } from "../game/engine";
import { createStudent } from "../game/generate";
import { fmt } from "../game/text";
import type { Student } from "../game/types";
import { LANG, tr } from "../i18n";
import { buildQuiz, hintFor, isTheme, isVoice, questionText } from "./quiz";

/** A printable training card for group work: big sections, short lines, the answer hidden in `reveal`. */
export interface GroupCard {
  seed: number;
  student: Student;
  head: string;
  badges: string[];
  ego: { name: string; emoji: string; color: string; value: number }[];
  blocks: { icon: string; head: string; lines: string[] }[];
  situation: { title: string; text: string };
  discuss: string[];
  reveal: { head: string; lines: string[] }[];
}

const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function cardOf(seed: number): GroupCard {
  const s = createStudent({ seed, blind: false });
  const f = (x: string) => fmt(x, s);
  const t = TYPES[s.mbti];
  const ego = EGO[dominantEgo(s)];
  const w = WOUNDS[woundOf(s)];
  const goal = goalById(s.goalId);
  const fam = familyById(s.familyId);
  const course = courseById(s.courseId);
  const d = driversOf(s.mbti);
  const main = d.drivers[0];
  const kk = LANG === "kk" ? 1 : 0;
  const quiz = buildQuiz(s, 0, { maxChars: 130 });
  const q = quiz.find((x) => !isTheme(x) && !isVoice(x) && !x.event.serious && x.event.id !== "first-message") ?? quiz.find((x) => !isTheme(x) && !isVoice(x)) ?? quiz[0];
  const wrong = q.event.options.findIndex((_, i) => !q.right.includes(i));
  const why = hintFor(s, q, wrong < 0 ? 0 : wrong).filter((l) => l.startsWith("✅") || l.startsWith("⚠️"));
  const own = w.phrases.slice(0, 2).map((p) => `«${f(p[kk])}»`);
  const mainName = main ? pick(DRIVERS[main].name) : "";
  return {
    seed, student: s,
    head: tr("{name}, {age}, {city}", { name: s.name, age: s.age, city: s.city }),
    badges: [`${s.mbti} · ${t.nick}`, `${ego.emoji} ${ego.name}`],
    ego: EGO_ORDER.map((k) => ({ name: EGO[k].name, emoji: EGO[k].emoji, color: EGO[k].color, value: s.ego[k] })),
    blocks: [
      { icon: "👤", head: tr("Кто он"), lines: [t.summary, tr("Важно для него: {v}", { v: low(t.motives).replace(/\.$/, "") })] },
      { icon: goal.icon, head: tr("Мечта и учёба"), lines: [`${goal.profession} · ${goal.uni}`, tr("Пробник: {mock}", { mock: s.mock }), tr("Сложности: {v}", { v: t.studentMinus.slice(0, 2).join("; ") })] },
      { icon: fam.icon, head: tr("Семья и курс"), lines: [f(fam.voice), `💳 ${course.name} · ${course.price}`] },
      { icon: "🌀", head: tr("Что у него в голове"), lines: [f(t.fearVoice), tr("Боится: {v}", { v: t.fears.slice(0, 2).join("; ") })] },
      { icon: "🎛️", head: tr("Драйвер и запрет"), lines: main ? [`★ ${mainName}: ${pick(DRIVERS[main].shows)}`, `«${f(pick(DRIVERS[main].says[0]))}»`, tr("Запрет: {v}", { v: d.bans.slice(0, 1).map((b) => pick(BANS[b])).join("; ") })] : [] },
      { icon: "🎙️", head: tr("Тело и голос"), lines: [w.pose[kk], ...own] },
    ],
    situation: { title: q.event.title, text: questionText(q, s) },
    discuss: [tr("Что с ним происходит на самом деле?"), tr("Что ему нужно услышать, чтобы остаться в диалоге?"), tr("Что вы ответите? Запишите дословно.")],
    reveal: [
      { head: tr("Чувствительная тема"), lines: [`${w.emoji} ${w.name}: ${w.theme}`, tr("Работает: {v}", { v: w.works.slice(0, 2).join("; ").toLowerCase() }), tr("Лучше избегать: {v}", { v: w.avoids.slice(0, 2).join("; ").toLowerCase() })] },
      { head: tr("Сильный ответ куратора"), lines: [...q.right.map((i) => `«${f(q.event.options[i].text)}»`), ...why] },
      { head: tr("Профиль"), lines: [tr("Ведущее эго-состояние: {v}", { v: ego.name }), tr("Привычные трудности: {v}", { v: t.problems.slice(0, 2).join("; ") })] },
    ],
  };
}

export const cardText = (c: GroupCard): string =>
  [`${c.head} · ${c.badges.join(" · ")}`, ...c.blocks.map((b) => `${b.icon} ${b.head}\n${b.lines.join("\n")}`), `❓ ${c.situation.title}\n${c.situation.text}`, ...c.discuss.map((x, i) => `${i + 1}. ${x}`)].join("\n\n");
