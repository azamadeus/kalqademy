import { EGO } from "../data/ego";
import { TYPES } from "../data/mbti";
import { courseById, familyById, goalById } from "../data/world";
import { WOUNDS } from "../data/wounds";
import { dominantEgo, woundOf } from "../game/engine";
import { fmt } from "../game/text";
import type { Student } from "../game/types";
import { LANG, tr } from "../i18n";
import { EGO_ORIGINAL, TYPE_ORIGINAL } from "./original-kk";

export interface Legend {
  title: string;
  sections: { icon: string; head: string; lines: string[] }[];
}

/** The student's backstory, built from their type, ego state, family, course and goal. Behaviour only, nothing about appearance. */
export function legendOf(s: Student): Legend {
  const t = TYPES[s.mbti];
  const ego = EGO[dominantEgo(s)];
  const w = WOUNDS[woundOf(s)];
  const goal = goalById(s.goalId);
  const fam = familyById(s.familyId);
  const course = courseById(s.courseId);
  const f = (x: string) => fmt(x, s);
  if (LANG === "kk") return legendKk(s, goal.icon, `${goal.profession} · ${goal.uni}`, goal.subjects, fam.icon, fam.label, f(fam.voice), `💳 ${course.name} · ${course.price}`, f(course.voice), f(t.fearVoice), title(s));
  return {
    title: title(s),
    sections: [
      { icon: goal.icon, head: tr("Мечта"), lines: [`${goal.profession} · ${goal.uni}`, goal.subjects] },
      { icon: "📚", head: tr("Учёба"), lines: [t.summary, `+ ${t.studentPlus.slice(0, 2).join(", ")}`, `− ${t.studentMinus.slice(0, 2).join(", ")}`, tr("🎓 Старт на пробнике: {mock}", { mock: s.mock })] },
      { icon: fam.icon, head: tr("Семья и курс"), lines: [fam.label, f(fam.voice), `💳 ${course.name} · ${course.price}`, f(course.voice)] },
      { icon: "🌀", head: tr("Тараканы в голове"), lines: [f(t.fearVoice), ego.coreProblem, w.theme, f(w.voice)] },
    ],
  };
}

const title = (s: Student) => tr("{name}, {age}, {city}", { name: s.name, age: s.age, city: s.city });

/** Kazakh version: type and ego-state descriptions are the original ALQA texts, not a translation. */
function legendKk(s: Student, gIcon: string, goalLine: string, subjects: string, fIcon: string, famLabel: string, famVoice: string, courseLine: string, courseVoice: string, fearVoice: string, head: string): Legend {
  const to = TYPE_ORIGINAL[s.mbti];
  const eo = EGO_ORIGINAL[dominantEgo(s)];
  return {
    title: head,
    sections: [
      { icon: gIcon, head: tr("Мечта"), lines: [goalLine, subjects] },
      { icon: "📚", head: tr("Учёба"), lines: [
        ...to.about.slice(0, 2),
        ...(to.plus.length ? [`✅ ${to.plus.slice(0, 2).join(" · ")}`] : []),
        ...(to.minus.length ? [`❌ ${to.minus.slice(0, 2).join(" · ")}`] : []),
        tr("🎓 Старт на пробнике: {mock}", { mock: s.mock }),
      ] },
      { icon: fIcon, head: tr("Семья и курс"), lines: [famLabel, famVoice, courseLine, courseVoice] },
      { icon: "🌀", head: tr("Тараканы в голове"), lines: [
        fearVoice,
        ...to.fears.slice(0, 2),
        ...eo.fears.slice(0, 2),
        ...(eo.problems.length || to.difficulties.length ? [[...to.difficulties.slice(0, 2), ...eo.problems.slice(0, 2)].join(" · ")] : []),
      ] },
    ],
  };
}
