import type {
  Curator,
  Ego,
  Option,
  Outcome,
  Rating,
  Skill,
  Stats,
  Student,
} from "./types";

export const SKILLS: Record<Skill, string> = {
  empathy: "Эмпатия",
  structure: "Структура",
  motivation: "Мотивация",
  family: "Работа с семьёй",
};

export const XP_PER_LEVEL = 40;

const TITLES = [
  "Стажёр",
  "Младший куратор",
  "Куратор",
  "Старший куратор",
  "Наставник",
  "Мастер-наставник",
];

export const emptyCurator = (): Curator => ({
  xp: 0,
  skills: { empathy: 0, structure: 0, motivation: 0, family: 0 },
});

export const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const titleOf = (xp: number) =>
  TITLES[Math.min(levelOf(xp) - 1, TITLES.length - 1)];

export const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

export const dominantEgo = (student: Student): Ego =>
  (Object.entries(student.ego) as [Ego, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0];

const sum = (d: Partial<Stats>): Stats => ({
  trust: d.trust ?? 0,
  motivation: d.motivation ?? 0,
  stress: d.stress ?? 0,
});

/** Higher is better; stress counts against the choice. */
export const score = (d: Stats) => d.trust + d.motivation - d.stress;

export function ratingOf(total: number): Rating {
  if (total >= 12) return "good";
  if (total >= 0) return "ok";
  return "bad";
}

export function applyOption(
  stats: Stats,
  student: Student,
  option: Option,
): Outcome {
  const delta = sum(option.delta);
  const notes: string[] = [];
  const ego = dominantEgo(student);

  for (const m of option.modifiers ?? []) {
    const letterOk = !m.letter || student.mbti.includes(m.letter);
    const egoOk = !m.ego || m.ego === ego;
    if (!letterOk || !egoOk) continue;
    const d = sum(m.delta);
    delta.trust += d.trust;
    delta.motivation += d.motivation;
    delta.stress += d.stress;
    notes.push(m.note);
  }

  const next: Stats = {
    trust: clamp(stats.trust + delta.trust),
    motivation: clamp(stats.motivation + delta.motivation),
    stress: clamp(stats.stress + delta.stress),
  };

  const rating = ratingOf(score(delta));
  const base = rating === "good" ? 15 : rating === "ok" ? 8 : 3;
  const skillGain = option.xp;
  const skillTotal = Object.values(skillGain).reduce((a, b) => a + (b ?? 0), 0);

  return {
    stats: next,
    delta,
    notes,
    xpGain: base + skillTotal,
    skillGain,
    rating,
  };
}

export function addXp(
  curator: Curator,
  xpGain: number,
  skillGain: Partial<Record<Skill, number>>,
): Curator {
  const skills = { ...curator.skills };
  for (const [k, v] of Object.entries(skillGain) as [Skill, number][]) {
    skills[k] += v;
  }
  return { xp: curator.xp + xpGain, skills };
}
