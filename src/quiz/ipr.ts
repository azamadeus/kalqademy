import { BANS, DRIVERS, driversOf, pick, type DriverKey } from "../data/drivers";
import { INTERVENTIONS } from "../data/workbooks";
import { TYPE_CODES } from "../data/mbti";
import { EGO_ORDER } from "../data/ego";
import { phrasesOf, woundPhrasesOf } from "../data/phrases";
import { woundOf } from "../game/engine";
import { mulberry32 } from "../game/rng";
import { fmt } from "../game/text";
import type { Student } from "../game/types";
import { NEGATIVE, featName, replyOf, type Feat } from "./features";
import { evidence, profileOf } from "./quiz";
import { EXTRA_BANS, label, taProfileOf, type TAProfile } from "./profile";
import { tr } from "../i18n";

export interface Item {
  id: string;
  text: string;
  sub?: string;
  /** Should be chosen. */
  ok: boolean;
  /** Counts against the plan when chosen. */
  bad?: boolean;
  feat?: Feat;
}

export interface PickSection {
  key: string;
  title: string;
  hint: string;
  /** How many items to choose. */
  pick: number;
  items: Item[];
}

export interface ProfileQuestion {
  key: "position" | "script" | "role" | "attention" | "freeChild" | "driver" | "ban";
  title: string;
  options: { id: string; text: string; sub?: string }[];
  right: string;
}

export interface Ipr {
  profile: TAProfile;
  questions: ProfileQuestion[];
  sections: PickSection[];
}

const GROUPS: Record<string, { feats: Feat[]; title: () => string; hint: () => string }> = {
  contact: { feats: ["l", "w", "f", "q", "r", "h"], title: () => tr("Первый контакт"), hint: () => tr("Что сказать и как себя вести в первых встречах. Выберите два.") },
  daily: { feats: ["g", "s", "c", "h", "e", "q"], title: () => tr("Как общаться дальше"), hint: () => tr("Постоянный стиль общения с этим учеником. Выберите два.") },
  motivation: { feats: ["m", "r", "n", "p", "a", "c"], title: () => tr("Если мотивация упала"), hint: () => tr("Что делать, когда ученик потерял интерес. Выберите два.") },
};

function shuffle<T>(a: T[], rng: () => number) {
  return a.slice().sort(() => rng() - 0.5);
}

/** The individual development plan (ИПР) form for a student, with the right answers read from their profile. */
export function buildIpr(student: Student, attempt = 0): Ipr {
  const rng = mulberry32(student.seed * 17 + attempt * 5 + 11);
  const profile = taProfileOf(student);
  const { v } = profileOf(student);
  const q: ProfileQuestion[] = [];
  const opt = <K extends string>(map: Record<K, { name: [string, string]; line: [string, string] }>, ids: K[]) => ids.map((id) => ({ id, text: label(map[id].name), sub: label(map[id].line) }));
  const mk = (key: ProfileQuestion["key"], title: string, options: ProfileQuestion["options"], right: string): ProfileQuestion => ({ key, title, options, right });
  q.push(mk("position", tr("Жизненная позиция"), opt(POS(), ["okok", "okno", "nook", "nono"]), profile.position));
  q.push(mk("script", tr("Сценарий"), opt(SCR(), ["winner", "nonwinner", "loser"]), profile.script));
  q.push(mk("role", tr("Роль в треугольнике Карпмана"), opt(ROL(), ["rescuer", "persecutor", "victim"]), profile.role));
  q.push(mk("attention", tr("Как получает внимание"), opt(ATT(), ["useful", "criticize", "achieve", "helpless", "show"]), profile.attention));
  if (profile.freeChild) q.push(mk("freeChild", tr("Свободный Ребёнок"), opt(FC(), ["positive", "too"]), profile.freeChild));
  const dr = Object.keys(DRIVERS) as DriverKey[];
  q.push(mk("driver", tr("Главный драйвер"), dr.map((d) => ({ id: d, text: pick(DRIVERS[d].name), sub: pick(DRIVERS[d].slogan) })), profile.drivers[0]));
  const banIds = [...Object.keys(BANS), ...Object.keys(EXTRA_BANS)];
  const mainBan = String(profile.bans[0]);
  const banPool = shuffle(banIds.filter((b) => !profile.bans.includes(b)), rng).slice(0, 3);
  q.push(mk("ban", tr("Главный запрет"), shuffle([mainBan, ...banPool], rng).map((b) => ({ id: b, text: banName(b) })), mainBan));

  const sections: PickSection[] = [];
  for (const [key, g] of Object.entries(GROUPS)) {
    const ranked = g.feats.slice().sort((a, b) => (v[b] ?? 0) - (v[a] ?? 0));
    const right = ranked.slice(0, 2);
    const wrong = ranked.slice(2, 4);
    const traps = NEGATIVE.slice().sort((a, b) => (v[a] ?? 0) - (v[b] ?? 0)).slice(0, 2);
    const items: Item[] = [
      ...right.map((f) => ({ id: `${key}-${f}`, text: replyOf(f), ok: true, feat: f })),
      ...wrong.map((f) => ({ id: `${key}-${f}`, text: replyOf(f), ok: false, feat: f })),
      ...traps.map((f) => ({ id: `${key}-${f}`, text: replyOf(f), ok: false, bad: true, feat: f })),
    ];
    sections.push({ key, title: g.title(), hint: g.hint(), pick: 2, items: shuffle(items, rng) });
  }
  const worst = NEGATIVE.slice().sort((a, b) => (v[a] ?? 0) - (v[b] ?? 0));
  const avoidItems: Item[] = [
    ...worst.slice(0, 2).map((f) => ({ id: `avoid-${f}`, text: featName(f), ok: true, feat: f })),
    ...worst.slice(2).map((f) => ({ id: `avoid-${f}`, text: featName(f), ok: false, feat: f })),
    ...(["l", "r"] as Feat[]).map((f) => ({ id: `avoid-${f}`, text: featName(f), ok: false, bad: true, feat: f })),
  ];
  sections.push({ key: "avoid", title: tr("Чего избегать"), hint: tr("Что убивает мотивацию этого ученика. Выберите два."), pick: 2, items: shuffle(avoidItems, rng) });

  const own = [...phrasesOf(student.mbti).slice(0, 2), ...woundPhrasesOf(woundOf(student)).slice(0, 1), ...driversOf(student.mbti).drivers.slice(0, 1).map((d) => pick(DRIVERS[d].says[0]))];
  const others = shuffle(TYPE_CODES.filter((c) => c !== student.mbti), rng).slice(0, 2).flatMap((c) => phrasesOf(c).slice(0, 2));
  sections.push({
    key: "words", title: tr("Его слова"), hint: tr("Какие фразы ученик часто повторяет. Выберите три."), pick: 3,
    items: shuffle([...own.map((t, i) => ({ id: `w-${i}`, text: fmt(t, student), ok: true })), ...others.map((t, i) => ({ id: `o-${i}`, text: fmt(t, student), ok: false }))], rng),
  });

  const sh = (k: (typeof EGO_ORDER)[number]) => student.ego[k];
  const scored = INTERVENTIONS.map((iv) => ({ iv, sc: iv.egos.reduce((a, k) => a + sh(k) / 40, 0) + (iv.wounds?.includes(woundOf(student)) ? 1.5 : 0) }));
  const top = scored.slice().sort((a, b) => b.sc - a.sc).slice(0, 4);
  const low = shuffle(scored.filter((x) => !top.includes(x) && x.sc < 0.7), rng).slice(0, 4);
  sections.push({
    key: "practice", title: tr("Практики из воркбуков"), hint: tr("Какие приёмы подойдут ученику. Выберите три."), pick: 3,
    items: shuffle([...top.map((x) => ({ id: x.iv.id, text: x.iv.title, sub: x.iv.how, ok: true })), ...low.map((x) => ({ id: x.iv.id, text: x.iv.title, sub: x.iv.how, ok: false }))], rng),
  });
  return { profile, questions: q, sections };
}

import { ATTENTIONS, FREE_CHILD, POSITIONS, ROLES, SCRIPTS } from "./profile";
const POS = () => POSITIONS;
const SCR = () => SCRIPTS;
const ROL = () => ROLES;
const ATT = () => ATTENTIONS;
const FC = () => FREE_CHILD;
export const banName = (b: string) => (b in BANS ? pick(BANS[b as keyof typeof BANS]) : label(EXTRA_BANS[b]));

export interface Grade {
  points: number;
  max: number;
  profile: { q: ProfileQuestion; chosen?: string; ok: boolean }[];
  sections: { s: PickSection; chosen: string[]; hits: number; lines: string[] }[];
  model: string;
}

export function gradeIpr(student: Student, ipr: Ipr, answers: Record<string, string>, picks: Record<string, string[]>): Grade {
  let points = 0;
  let max = 0;
  const profile = ipr.questions.map((q) => {
    max += 1;
    const ok = answers[q.key] === q.right;
    if (ok) points += 1;
    return { q, chosen: answers[q.key], ok };
  });
  const sections = ipr.sections.map((s) => {
    const chosen = picks[s.key] ?? [];
    const rightN = s.items.filter((i) => i.ok).length;
    max += Math.min(s.pick, rightN);
    let hits = 0;
    const lines: string[] = [];
    for (const id of chosen) {
      const it = s.items.find((i) => i.id === id);
      if (!it) continue;
      if (it.ok) { hits++; points += 1; }
      else if (it.bad) points -= 1;
      if (it.feat) {
        const e = evidence(student, it.feat, it.ok ? 1 : -1) ?? evidence(student, it.feat, it.ok ? -1 : 1);
        if (e && !(s.key === "words")) lines.push(`${it.ok ? "✅" : "❌"} ${featName(it.feat)}: «${e.src}» (${e.who})`);
      }
    }
    return { s, chosen, hits, lines };
  });
  const { v } = profileOf(student);
  const f1 = (Object.keys(v) as Feat[]).filter((f) => !NEGATIVE.includes(f)).sort((a, b) => (v[b] ?? 0) - (v[a] ?? 0))[0];
  const main = driversOf(student.mbti).drivers[0];
  const model = [f1 ? replyOf(f1) : "", main ? pick(DRIVERS[main].permission) + "." : ""].filter(Boolean).join(" ");
  return { points: Math.max(0, points), max, profile, sections, model };
}
