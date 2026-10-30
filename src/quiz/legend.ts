import { EGO } from "../data/ego";
import { TYPES } from "../data/mbti";
import { courseById, familyById, goalById } from "../data/world";
import { WOUNDS } from "../data/wounds";
import { dominantEgo, woundOf } from "../game/engine";
import { fmt } from "../game/text";
import type { Student } from "../game/types";
import { tr } from "../i18n";

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
  return {
    title: tr("{name}, {age}, {city}", { name: s.name, age: s.age, city: s.city }),
    sections: [
      { icon: goal.icon, head: tr("Мечта"), lines: [`${goal.profession} · ${goal.uni}`, goal.subjects] },
      { icon: "📚", head: tr("Учёба"), lines: [t.summary, `+ ${t.studentPlus.slice(0, 2).join(", ")}`, `− ${t.studentMinus.slice(0, 2).join(", ")}`, tr("🎓 Старт на пробнике: {mock}", { mock: s.mock })] },
      { icon: fam.icon, head: tr("Семья и курс"), lines: [fam.label, f(fam.voice), `💳 ${course.name} · ${course.price}`, f(course.voice)] },
      { icon: "🌀", head: tr("Тараканы в голове"), lines: [f(t.fearVoice), ego.coreProblem, w.theme, f(w.voice)] },
    ],
  };
}
