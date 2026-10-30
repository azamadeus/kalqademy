import type { EgoKey } from "../game/types";

type Egogram = Record<EgoKey, number>;
const g = (caring_parent: number, critical_parent: number, adult: number, adapted_child: number, natural_child: number): Egogram =>
  ({ caring_parent, critical_parent, adult, adapted_child, natural_child });

/**
 * Typical egogram per MBTI type (0..100): all five ego states, not just the dominant one.
 * Read from the "Трансактілік талдау / Эго-күйлері" pages of the ALQA type PDFs
 * (high / medium / low per state). INFJ and INTJ have no such page in the files, so those two are
 * inferred from their type descriptions. A training model, not a measurement.
 */
export const TYPE_EGO: Record<string, Egogram> = {
  ENFJ: g(70, 62, 20, 65, 35),
  ENFP: g(62, 25, 42, 40, 70),
  ENTJ: g(25, 70, 62, 55, 22),
  ENTP: g(25, 30, 65, 55, 60),
  ESFJ: g(72, 40, 20, 65, 20),
  ESFP: g(50, 35, 45, 62, 65),
  ESTJ: g(60, 70, 66, 62, 20),
  ESTP: g(25, 55, 55, 50, 65),
  INFJ: g(65, 45, 50, 62, 28),
  INFP: g(60, 20, 35, 60, 62),
  INTJ: g(25, 65, 70, 45, 22),
  INTP: g(18, 45, 72, 60, 55),
  ISFJ: g(65, 60, 55, 70, 20),
  ISFP: g(62, 22, 45, 45, 68),
  ISTJ: g(40, 68, 70, 62, 20),
  ISTP: g(15, 62, 62, 20, 66),
};
