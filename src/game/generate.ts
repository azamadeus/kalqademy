import { EGO_ORDER } from "../data/ego";
import type { WoundKey } from "../data/wounds";
import { TYPE_EGO } from "../data/egogram";
import { TYPE_CODES } from "../data/mbti";
import { CITIES, COURSES, FAMILIES, GOALS, NAMES } from "../data/world";
import { clamp, mulberry32, pick } from "./rng";
import type { EgoKey, Student } from "./types";

export function makeEgo(rng: () => number, mbti: string, dominant?: EgoKey, second?: EgoKey): Record<EgoKey, number> {
  const base = TYPE_EGO[mbti];
  const ego = {} as Record<EgoKey, number>;
  for (const k of EGO_ORDER) ego[k] = Math.round(clamp(base[k] + (rng() - 0.5) * 14, 8, 80));
  if (dominant) {
    for (const k of EGO_ORDER) if (k !== dominant) ego[k] = Math.min(ego[k], 60);
    ego[dominant] = Math.max(ego[dominant], Math.round(68 + rng() * 8));
  }
  if (second && second !== dominant) ego[second] = Math.max(ego[second], Math.round(44 + rng() * 8));
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
  wound?: WoundKey;
  /** Full egogram override (all five states, 0..100). */
  ego?: Record<EgoKey, number>;
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
    ego: opts.ego ?? makeEgo(rng, mbti, opts.dominant, opts.second),
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
    ...(opts.wound ? { wound: opts.wound } : {}),
  };
}
