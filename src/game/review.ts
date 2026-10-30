import { TACTICS } from "./text";
import type { CaseState, Quality, Tactic } from "./types";
import { tr } from "../i18n";

export interface SeasonReview {
  counts: Record<Quality, number>;
  total: number;
  best: Tactic | null;
  weak: Tactic | null;
  toneRate: number;
  planned: number;
  strengths: string[];
  improve: string[];
}

const POINTS: Record<Quality, number> = { great: 3, good: 2, meh: 1, bad: 0 };

export function seasonReview(c: CaseState): SeasonReview {
  const h = c.history ?? [];
  const counts: Record<Quality, number> = { great: 0, good: 0, meh: 0, bad: 0 };
  const byTactic = new Map<Tactic, number[]>();
  for (const t of h) {
    counts[t.quality]++;
    byTactic.set(t.tactic, [...(byTactic.get(t.tactic) ?? []), POINTS[t.quality]]);
  }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const ranked = [...byTactic.entries()].filter(([, v]) => v.length >= 2).sort((a, b) => avg(b[1]) - avg(a[1]));
  const best = ranked[0]?.[0] ?? null;
  const weak = ranked.length > 1 ? ranked[ranked.length - 1][0] : null;
  const toneRate = h.length ? h.filter((x) => x.toneOk).length / h.length : 0;
  const planned = h.filter((x) => x.planned).length;
  const good = counts.great + counts.good;

  const strengths: string[] = [];
  const improve: string[] = [];
  if (h.length && good / h.length >= 0.6) strengths.push(tr("Большинство ходов было удачным: вы чаще попадали в то, что нужно ученику."));
  if (toneRate >= 0.7) strengths.push(tr("Тон общения чаще всего совпадал с ожиданиями ученика."));
  if (best) strengths.push(tr("Лучше всего у вас получалась тактика «{v}».", { v: TACTICS[best].name }));
  if (planned >= 3) strengths.push(tr("План развития сработал в {planned} ситуациях.", { planned }));
  if (c.trust >= 75) strengths.push(tr("Удалось выстроить очень тёплые, доверительные отношения."));
  if (h.length && toneRate < 0.5) improve.push(tr("Тон часто не попадал. Спрашивайте ученика о комфортном тоне и ориентируйтесь на уровень доверия: близкий тон для малознакомых воспринимается как давление."));
  if (counts.bad >= 3) improve.push(tr("Было {bad} неудачных ходов. Давление и «прямой разговор» без учёта чувствительности ученика чаще всего ухудшают контакт.", { bad: counts.bad }));
  if (weak && weak !== best) improve.push(tr("Тактику «{v}» стоит применять осторожнее: в среднем она давала слабый результат.", { v: TACTICS[weak].name }));
  if (!c.plan) improve.push(tr("План развития не составлен. Он даёт бонус в ситуациях, к которым вы подготовились."));
  if (c.asked.length < 4) improve.push(tr("Мало вопросов ученику. Диагностика помогает точнее выбирать тактику и тон."));
  if (c.stress > 60) improve.push(tr("Итоговый стресс ученика высокий. Чаще давайте паузы и отдых, особенно перед экзаменом."));
  if (!strengths.length) strengths.push(tr("Сезон пройден. Попробуйте ещё раз, обращая внимание на тон и особенности ученика."));
  return { counts, total: h.length, best, weak, toneRate, planned, strengths, improve };
}
