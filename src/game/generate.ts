import { EGO_ORDER } from "../data/ego";
import { TYPE_CODES } from "../data/mbti";
import { CITIES, COURSES, FAMILIES, GOALS, NAMES } from "../data/world";
import { clamp, mulberry32, pick } from "./rng";
import type { EgoKey, Student } from "./types";

/** Typical ego tendencies per MBTI letter (soft, not deterministic). */
function egoWeights(mbti: string): Record<EgoKey, number> {
  const w: Record<EgoKey, number> = {
    caring_parent: 1,
    critical_parent: 1,
    adult: 1,
    adapted_child: 1,
    natural_child: 1,
  };
  const [ei, sn, tf, jp] = mbti.split("");
  if (tf === "F") { w.caring_parent += 1.2; w.adapted_child += 1.2; }
  if (tf === "T") { w.adult += 1.5; w.critical_parent += 0.8; }
  if (jp === "J") { w.critical_parent += 1; w.adult += 0.5; }
  if (jp === "P") { w.natural_child += 1.4; }
  if (ei === "E") { w.natural_child += 0.5; w.caring_parent += 0.3; }
  if (ei === "I") { w.adapted_child += 0.5; w.adult += 0.3; }
  if (sn === "N") { w.natural_child += 0.3; }
  return w;
}

function weightedPick<T extends string>(rng: () => number, w: Record<T, number>): T {
  const keys = Object.keys(w) as T[];
  let r = rng() * keys.reduce((a, k) => a + w[k], 0);
  for (const k of keys) {
    r -= w[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

export function makeEgo(rng: () => number, mbti: string, dominant?: EgoKey, second?: EgoKey): Record<EgoKey, number> {
  const w = egoWeights(mbti);
  const dom = dominant ?? weightedPick(rng, w);
  const rest = { ...w } as Record<EgoKey, number>;
  delete (rest as Partial<Record<EgoKey, number>>)[dom];
  const sec = second && second !== dom ? second : weightedPick(rng, rest as Record<EgoKey, number>);
  const ego = {} as Record<EgoKey, number>;
  for (const k of EGO_ORDER) ego[k] = Math.round(8 + rng() * 14);
  ego[dom] = Math.round(52 + rng() * 20);
  ego[sec] = Math.round(30 + rng() * 12);
  return ego;
}

export interface StudentOptions {
  seed: number;
  name?: string;
  gender?: "f" | "m";
  mbti?: string;
  dominant?: EgoKey;
  second?: EgoKey;
  familyId?: string;
  courseId?: string;
  goalId?: string;
  mock?: number;
  blind?: boolean;
  age?: number;
  city?: string;
}

export function createStudent(opts: StudentOptions): Student {
  const rng = mulberry32(opts.seed);
  const gender = opts.gender ?? (rng() < 0.5 ? "f" : "m");
  const mbti = opts.mbti ?? pick(rng, TYPE_CODES);
  return {
    id: `s${opts.seed}`,
    name: opts.name ?? pick(rng, NAMES[gender]),
    gender,
    age: opts.age ?? 16 + Math.floor(rng() * 3),
    city: opts.city ?? pick(rng, CITIES),
    mbti,
    ego: makeEgo(rng, mbti, opts.dominant, opts.second),
    familyId: opts.familyId ?? pick(rng, FAMILIES).id,
    courseId: opts.courseId ?? pick(rng, COURSES).id,
    goalId: opts.goalId ?? pick(rng, GOALS).id,
    mock: opts.mock ?? Math.round(clamp(52 + rng() * 46, 40, 110)),
    seed: opts.seed,
    look: {
      skin: Math.floor(rng() * 5),
      hair: Math.floor(rng() * 6),
      hairColor: Math.floor(rng() * 6),
      accessory: Math.floor(rng() * 4),
    },
    blind: opts.blind ?? true,
  };
}
