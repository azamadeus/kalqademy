import { EGO, EGO_ORDER } from "../data/ego";
import { EVENTS } from "../data/events";
import { INTERVENTIONS, interventionById, ivSource, type Intervention } from "../data/workbooks";
import { PROBLEMS, familyById } from "../data/world";
import { bestTone, dominantEgo, preferredWarmth, STAGES, woundOf } from "./engine";
import { TONES } from "./text";
import type { CaseState, EgoKey, Letter, Plan, PlanResult, ProblemKey, Stage, Student } from "./types";
import { tr } from "../i18n";

export const emptyPlan = (student: Student): Plan => ({
  goalScore: Math.min(140, student.mock + 30),
  focus: [],
  tone: null,
  steps: {
    meet: { interventionIds: [], note: "" },
    diagnose: { interventionIds: [], note: "" },
    trust: { interventionIds: [], note: "" },
    work: { interventionIds: [], note: "" },
    exam: { interventionIds: [], note: "" },
  },
  metrics: "",
  message: "",
  family: "",
});

/** Which problem areas this student is actually prone to (hidden from the player until the end). */
export function problemProfile(student: Student): Record<ProblemKey, number> {
  const w = Object.fromEntries(Object.keys(PROBLEMS).map((k) => [k, 0])) as Record<ProblemKey, number>;
  const ego = dominantEgo(student);
  const letters = student.mbti.split("") as Letter[];
  const fam = familyById(student.familyId);
  for (const e of EVENTS) {
    if (e.prone?.ego?.includes(ego)) w[e.problem] += 1.5;
    w[e.problem] += (e.prone?.letters?.filter((l) => letters.includes(l)).length ?? 0) * 0.7;
  }
  for (const p of fam.boosts) w[p] += 2.5;
  return w;
}

export const topProblems = (student: Student, n = 3): ProblemKey[] => {
  const w = problemProfile(student);
  return (Object.keys(w) as ProblemKey[]).sort((a, b) => w[b] - w[a]).slice(0, n);
};

const secondEgo = (student: Student): EgoKey => EGO_ORDER.filter((k) => k !== dominantEgo(student)).sort((a, b) => student.ego[b] - student.ego[a])[0];

export function interventionFit(student: Student, iv: Intervention, stage?: Stage): number {
  const dom = dominantEgo(student);
  const egoMatch = iv.egos.includes(dom) ? 1 : iv.egos.includes(secondEgo(student)) ? 0.6 : 0;
  const top = topProblems(student, 3);
  const overlap = iv.problems.filter((p) => top.includes(p)).length;
  const stageOk = !stage || iv.stages.includes(stage) ? 1 : 0.6;
  const woundBonus = iv.wounds?.includes(woundOf(student)) ? 0.25 : 0;
  return Math.min(1, (0.5 * egoMatch + 0.5 * Math.min(1, overlap) + woundBonus) * stageOk);
}

/** The planned intervention (if any) that prepared the curator for this problem in the current stage. */
export function planCovers(plan: Plan | null | undefined, stage: Stage, problem: ProblemKey): Intervention | null {
  if (!plan) return null;
  for (const id of plan.steps[stage]?.interventionIds ?? []) {
    const iv = interventionById(id);
    if (iv && iv.problems.includes(problem)) return iv;
  }
  return null;
}

export const planBonusFor = (score: number) => (score >= 60 ? 3 : score >= 35 ? 2 : 1);

const PLAN_VOICE: Record<EgoKey, { low: string; mid: string; high: string }> = {
  caring_parent: {
    low: tr("Я посмотрел{а} план… В нём совсем нет места для моей усталости. Кажется, я опять {должен|должна} всё тянуть сам{а}."),
    mid: tr("План неплохой. Мне нравится, что есть время и для меня. Надеюсь, получится его придерживаться."),
    high: tr("В этом плане меня наконец увидели: и цель, и мой отдых, и границы. Я чувствую, что могу выдохнуть."),
  },
  critical_parent: {
    low: tr("Тут слишком много лишнего и ничего про мою тревогу. Я боюсь, что мы потеряем время."),
    mid: tr("План выглядит разумно, хотя я всё равно волнуюсь, смогу ли выполнить всё идеально."),
    high: tr("Понятный план с шагами и разрешением на ошибки. Впервые не страшно начинать."),
  },
  adult: {
    low: tr("План расплывчатый: нет критериев и логики, зачем эти шаги. Трудно воспринимать всерьёз."),
    mid: tr("Структура есть, но хотелось бы больше конкретных критериев и сроков."),
    high: tr("Чёткие цели, этапы и метрики. Это то, что мне нужно. {Согласен|Согласна} работать по этому плану."),
  },
  adapted_child: {
    low: tr("Мне кажется, это план для кого-то другого. Меня никто не спрашивал, чего хочу я…"),
    mid: tr("Наверное, нормально. Мне бы хотелось, чтобы вы спросили, {согласен|согласна} ли я с шагами."),
    high: tr("Тут учтено то, что мне важно, и мне не страшно сказать своё мнение. Спасибо, что со мной договорились."),
  },
  natural_child: {
    low: tr("Скукота! Опять списки и правила. Я на такое не подпишусь."),
    mid: tr("Местами норм, местами скучно. Можно добавить больше игры и наград?"),
    high: tr("О, тут и цели, и награды, и мини-победы! Давайте начинать, я в деле!"),
  },
};

export function evaluatePlan(student: Student, c: CaseState, plan: Plan, at: number, reveal: boolean): PlanResult {
  const mock = student.mock;
  const g = Math.min(140, plan.goalScore);
  const lo = mock + 15;
  const hi = mock + 45;
  const goal = g <= mock ? 0 : g < lo ? (g - mock) / 15 : g <= hi ? 1 : Math.max(0, 1 - (g - hi) / 30);

  const top = topProblems(student, 3);
  const focusHits = plan.focus.filter((p) => top.includes(p)).length;
  const focus = Math.min(1, focusHits / 3);

  const chosen: { iv: Intervention; stage: Stage }[] = [];
  for (const s of STAGES) for (const id of plan.steps[s.id].interventionIds) {
    const iv = interventionById(id);
    if (iv) chosen.push({ iv, stage: s.id });
  }
  const fit = chosen.length ? chosen.reduce((a, x) => a + interventionFit(student, x.iv, x.stage), 0) / chosen.length : 0;

  const filledStages = STAGES.filter((s) => plan.steps[s.id].interventionIds.length > 0).length;
  const needsFamily = familyById(student.familyId).boosts.includes("family") || familyById(student.familyId).boosts.includes("money");
  const complete =
    (filledStages / STAGES.length) * 0.6 +
    (plan.metrics.trim().length >= 20 ? 0.15 : 0) +
    (plan.message.trim().length >= 20 ? 0.15 : 0) +
    (plan.family.trim().length >= 15 || !needsFamily ? 0.1 : 0);

  const pref = preferredWarmth(student, c.trust);
  const tone = plan.tone == null ? 0 : Math.max(0, 1 - Math.abs(plan.tone - pref) / 2);

  const parts = {
    goal: Math.round(goal * 100),
    focus: Math.round(focus * 100),
    fit: Math.round(fit * 100),
    complete: Math.round(complete * 100),
    tone: Math.round(tone * 100),
  };
  const score = Math.round(goal * 15 + focus * 20 + fit * 35 + complete * 15 + tone * 15);

  const egoInfo = EGO[dominantEgo(student)];
  const expert: string[] = [];
  expert.push(
    goal >= 0.9
      ? tr("✅ Цель {g} реалистична: рост {mock} баллов за 12 недель выполним.", { g, mock: g - mock })
      : g <= mock
        ? tr("❌ Цель {g} не выше стартового балла {mock}. Нужен рост хотя бы на 15 баллов.", { g, mock })
        : g < lo
          ? tr("⚠️ Цель {g} слишком скромная: можно ставить {lo}–{hi}.", { g, lo, hi })
          : tr("⚠️ Цель {g} слишком амбициозна для 12 недель (разумно до {hi}): риск разочарования и стресса.", { g, hi }),
  );
  if (!plan.focus.length) expert.push(tr("❌ Не выбраны приоритетные проблемные зоны."));
  else if (reveal) expert.push(tr("{focusHits} Совпало приоритетов: {focusHits2} из 3. Главные зоны ученика: {v}.", { focusHits: focusHits === 3 ? "✅" : "⚠️", focusHits2: focusHits, v: top.map((p) => PROBLEMS[p]).join(", ") }));
  else expert.push(tr("{focusHits} Совпало приоритетов: {focusHits2} из 3. Точные зоны откроются, когда профиль станет известен.", { focusHits: focusHits === 3 ? "✅" : "⚠️", focusHits2: focusHits }));
  if (!chosen.length) expert.push(tr("❌ В плане нет ни одного приёма из воркбуков."));
  else expert.push(tr("{fit} Подходящесть приёмов этому ученику: {fit2}%.", { fit: fit >= 0.65 ? "✅" : fit >= 0.4 ? "⚠️" : "❌", fit2: parts.fit }));
  const weak = chosen.filter((x) => interventionFit(student, x.iv, x.stage) < 0.4);
  if (weak.length) expert.push(tr("Слабее всего подходят: {list}.", { list: weak.slice(0, 3).map((x) => `«${x.iv.title}» (${ivSource(x.iv)})`).join(", ") }));
  const missing = STAGES.filter((s) => !plan.steps[s.id].interventionIds.length).map((s) => s.name);
  if (missing.length) expert.push(tr("⚠️ Не заполнены этапы: {v}.", { v: missing.join(", ") }));
  if (plan.metrics.trim().length < 20) expert.push(tr("⚠️ Опишите метрики успеха: что именно будет считаться прогрессом (баллы пробников, режим, стресс)."));
  if (plan.message.trim().length < 20) expert.push(tr("⚠️ Добавьте, что именно вы скажете ученику: план должен быть озвучен и согласован с ним."));
  if (needsFamily && plan.family.trim().length < 15) expert.push(tr("⚠️ Для такой семьи нужен продуманный план работы с родителями."));
  expert.push(
    plan.tone == null
      ? tr("❌ Не выбран тон общения.")
      : tone >= 0.75
        ? tr("✅ Тон «{v}» подходит ученику.", { v: TONES[plan.tone].name })
        : tr("⚠️ Ученику ближе тон «{v}».", { v: TONES[bestTone(student, c.trust)].name }),
  );
  const recs = INTERVENTIONS.filter((iv) => !chosen.some((x) => x.iv.id === iv.id))
    .map((iv) => ({ iv, f: interventionFit(student, iv) }))
    .sort((a, b) => b.f - a.f)
    .slice(0, 3);
  expert.push(tr("Что стоило бы добавить: {list}.", { list: recs.map((r) => `«${r.iv.title}» (${ivSource(r.iv)})`).join(", ") }));
  if (reveal) expert.push(tr("Ориентир ALQA для «{v}»: {v2}.", { v: egoInfo.name, v2: egoInfo.motivate[0].toLowerCase() }));

  const band = score >= 70 ? "high" : score >= 40 ? "mid" : "low";
  return {
    at,
    score,
    parts,
    studentMessage: PLAN_VOICE[dominantEgo(student)][band],
    expert,
    xp: 8 + Math.round(score / 5),
  };
}
