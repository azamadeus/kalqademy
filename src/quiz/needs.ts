import { EGO, EGO_ORDER } from "../data/ego";
import { BANS, DRIVERS, driversOf, pick, type DriverKey } from "../data/drivers";
import { TYPES } from "../data/mbti";
import { WOUNDS } from "../data/wounds";
import { woundOf } from "../game/engine";
import type { EgoKey, Student } from "../game/types";
import { tr } from "../i18n";
import type { Feat } from "./features";

/** Where a need comes from: a statement in the materials. */
export interface Need {
  f: Feat;
  w: number;
  /** The statement from the materials that this need was read from. */
  src: string;
  /** Whose statement it is. */
  who: string;
}

type Row = [Feat, number, "w" | "a", number];
type EgoRow = [Feat, number, "m" | "v", number];

/**
 * What each type needs and what kills their motivation, read from the lists "works" and "avoids"
 * (ALQA type materials): [feature, weight, list, item].
 */
const TYPE_ROWS: Record<string, Row[]> = {
  INTJ: [["g", 2, "w", 0], ["c", 2, "w", 1], ["s", 1, "w", 2], ["V", -2, "a", 1], ["O", -2, "a", 2], ["w", -1, "a", 0]],
  INTP: [["m", 2, "w", 1], ["e", 2, "w", 0], ["n", 1, "w", 2], ["X", -2.5, "a", 0], ["l", -1, "a", 1]],
  ENTJ: [["h", 2, "w", 0], ["c", 1.5, "w", 1], ["s", 1, "w", 2], ["w", -1, "a", 0], ["V", -2, "a", 1], ["D", -2, "a", 2]],
  ENTP: [["p", 2, "w", 0], ["c", 2, "w", 1], ["r", 1, "w", 2], ["O", -2.5, "a", 0], ["X", -2.5, "a", 2]],
  INFJ: [["m", 2, "w", 0], ["f", 2, "w", 1], ["e", 1, "w", 2], ["X", -3, "a", 1], ["V", -1.5, "a", 2]],
  INFP: [["m", 2, "w", 0], ["n", 2, "w", 1], ["f", 2, "w", 2], ["X", -3, "a", 1], ["D", -3, "a", 2], ["h", -1.5, "a", 0]],
  ENFJ: [["r", 2.5, "w", 0], ["s", 1.5, "w", 1], ["m", 1.5, "w", 2], ["D", -2, "a", 0], ["T", -2, "a", 1], ["X", -2.5, "a", 2]],
  ENFP: [["c", 2.5, "w", 0], ["m", 2, "w", 1], ["w", 2, "w", 2], ["O", -3, "a", 0], ["s", -1, "a", 1], ["D", -2, "a", 2]],
  ISTJ: [["s", 3, "w", 0], ["g", 2, "w", 1], ["r", 1.5, "w", 2], ["q", 1.5, "a", 0], ["V", -3, "a", 1], ["l", -1, "a", 2]],
  ISFJ: [["r", 2.5, "w", 0], ["q", 2, "w", 1], ["f", 2, "w", 2], ["T", -2.5, "a", 1], ["X", -2, "a", 0], ["D", -2, "a", 2]],
  ESTJ: [["s", 3, "w", 0], ["r", 1.5, "w", 1], ["h", 2, "w", 2], ["V", -2.5, "a", 1], ["D", -2, "a", 2]],
  ESFJ: [["w", 3, "w", 0], ["r", 2.5, "w", 0], ["l", 1, "w", 1], ["c", 1, "w", 2], ["D", -3, "a", 0], ["X", -2, "a", 1], ["T", -2, "a", 2]],
  ISTP: [["p", 2, "w", 0], ["c", 2.5, "w", 1], ["g", 1.5, "w", 2], ["l", -2.5, "a", 0], ["O", -2.5, "a", 1]],
  ISFP: [["f", 2, "w", 2], ["r", 1.5, "w", 0], ["e", 2, "w", 1], ["w", 1, "w", 2], ["X", -3, "a", 1], ["h", -2, "a", 2], ["D", -2, "a", 2]],
  ESTP: [["p", 3, "w", 0], ["h", 2, "w", 2], ["n", 1, "w", 0], ["O", -3, "a", 1], ["s", -1, "a", 2]],
  ESFP: [["w", 3, "w", 0], ["p", 2.5, "w", 1], ["n", 1.5, "w", 2], ["r", 2, "w", 0], ["X", -2, "a", 0], ["T", -3, "a", 2]],
};

/** What each ego state needs, read from "how to motivate" and "what to avoid". */
const EGO_ROWS: Record<EgoKey, EgoRow[]> = {
  caring_parent: [["r", 2, "m", 0], ["a", 2, "m", 1], ["e", 1.5, "m", 2], ["X", -3, "v", 0], ["D", -1, "v", 1]],
  critical_parent: [["r", 2, "m", 0], ["a", 2.5, "m", 1], ["X", -2.5, "v", 1], ["T", -2, "v", 2]],
  adult: [["g", 2.5, "m", 0], ["s", 1.5, "m", 0], ["V", -3, "v", 1], ["l", -1, "v", 2]],
  adapted_child: [["f", 2.5, "m", 1], ["c", 2, "m", 0], ["r", 2, "m", 2], ["l", 1, "m", 0], ["O", -2, "v", 0], ["X", -2.5, "v", 1], ["D", -2, "v", 2]],
  natural_child: [["p", 2.5, "m", 0], ["c", 1.5, "m", 0], ["m", 1, "m", 1], ["r", 1, "m", 2], ["O", -2.5, "v", 0], ["X", -2, "v", 2]],
};

type WRow = [Feat, number, "w" | "a", number];
const WOUND_ROWS: Record<string, WRow[]> = {
  rejection: [["e", 1.5, "w", 2], ["n", 2, "w", 1], ["r", 1, "w", 0], ["f", 2, "w", 2], ["T", -3, "a", 1], ["D", -3, "a", 0], ["X", -2, "a", 2]],
  abandonment: [["q", 2.5, "w", 0], ["w", 2, "w", 2], ["c", 1, "w", 1], ["D", -2.5, "a", 0], ["X", -2, "a", 1], ["e", -1, "a", 2]],
  humiliation: [["f", 3, "w", 0], ["a", 1.5, "w", 1], ["r", 1, "w", 0], ["T", -3, "a", 1], ["X", -2.5, "a", 0]],
  betrayal: [["q", 3, "w", 0], ["g", 1.5, "w", 1], ["c", 1, "w", 2], ["V", -2, "a", 2], ["D", -1.5, "a", 0]],
  injustice: [["g", 2.5, "w", 0], ["a", 2, "w", 2], ["r", 1.5, "w", 1], ["q", 1, "w", 0], ["V", -2.5, "a", 2], ["X", -2.5, "a", 2]],
};

/** What helps with each driver: the "permission". */
const DRIVER_ROWS: Record<DriverKey, [Feat, number][]> = {
  perfect: [["a", 2.5], ["X", -1.5]],
  strong: [["c", 1.5], ["a", 1.5], ["l", 1], ["r", 1]],
  please: [["c", 2], ["r", 1.5], ["a", 1]],
  try: [["r", 2.5], ["n", 1.5]],
  hurry: [["e", 2.5], ["n", 1.5], ["s", 1]],
};

/** Everything the materials say about what this student needs and what kills their motivation. */
export function needsOf(s: Student): Need[] {
  const out: Need[] = [];
  const t = TYPES[s.mbti];
  for (const [f, w, list, i] of TYPE_ROWS[s.mbti] ?? []) {
    out.push({ f, w, src: (list === "w" ? t.works : t.avoids)[i], who: tr("тип {mbti}", { mbti: s.mbti }) });
  }
  const total = EGO_ORDER.reduce((a, k) => a + s.ego[k], 0) || 1;
  for (const k of EGO_ORDER) {
    const share = s.ego[k] / total;
    for (const [f, w, list, i] of EGO_ROWS[k]) {
      out.push({ f, w: w * share * 2.2, src: (list === "m" ? EGO[k].motivate : EGO[k].avoid)[i], who: tr("эго-состояние «{name}»", { name: EGO[k].name }) });
    }
  }
  const wk = woundOf(s);
  const wd = WOUNDS[wk];
  for (const [f, w, list, i] of WOUND_ROWS[wk]) out.push({ f, w, src: (list === "w" ? wd.works : wd.avoids)[i], who: tr("тема «{name}»", { name: wd.name }) });
  driversOf(s.mbti).drivers.forEach((d, idx) => {
    for (const [f, w] of DRIVER_ROWS[d]) out.push({ f, w: w * (idx === 0 ? 1 : 0.5), src: pick(DRIVERS[d].permission), who: tr("драйвер «{name}»", { name: pick(DRIVERS[d].name) }) });
  });
  void BANS;
  return out;
}

/** Total weight of each feature for the student. */
export function needVector(needs: Need[]): Partial<Record<Feat, number>> {
  const v: Partial<Record<Feat, number>> = {};
  for (const n of needs) v[n.f] = (v[n.f] ?? 0) + n.w;
  return v;
}
