import { EGO, EGO_ORDER } from "../data/ego";
import { EVENTS } from "../data/events";
import { INTERVENTIONS, interventionById, ivSource, type Intervention } from "../data/workbooks";
import { PROBLEMS, familyById } from "../data/world";
import { bestTone, dominantEgo, preferredWarmth, STAGES } from "./engine";
import { TONES } from "./text";
import type { CaseState, EgoKey, Letter, Plan, PlanResult, ProblemKey, Stage, Student } from "./types";

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
  return (0.5 * egoMatch + 0.5 * Math.min(1, overlap)) * stageOk;
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
    low: "Я посмотрел{а} план… В нём совсем нет места для моей усталости. Кажется, я опять {должен|должна} всё тянуть сам{а}.",
    mid: "План неплохой. Мне нравится, что есть время и для меня. Надеюсь, получится его придерживаться.",
    high: "В этом плане меня наконец увидели: и цель, и мой отдых, и границы. Я чувствую, что могу выдохнуть.",
  },
  critical_parent: {
    low: "Тут слишком много лишнего и ничего про мою тревогу. Я боюсь, что мы потеряем время.",
    mid: "План выглядит разумно, хотя я всё равно волнуюсь, смогу ли выполнить всё идеально.",
    high: "Понятный план с шагами и разрешением на ошибки. Впервые не страшно начинать.",
  },
  adult: {
    low: "План расплывчатый: нет критериев и логики, зачем эти шаги. Трудно воспринимать всерьёз.",
    mid: "Структура есть, но хотелось бы больше конкретных критериев и сроков.",
    high: "Чёткие цели, этапы и метрики. Это то, что мне нужно. {Согласен|Согласна} работать по этому плану.",
  },
  adapted_child: {
    low: "Мне кажется, это план для кого-то другого. Меня никто не спрашивал, чего хочу я…",
    mid: "Наверное, нормально. Мне бы хотелось, чтобы вы спросили, {согласен|согласна} ли я с шагами.",
    high: "Тут учтено то, что мне важно, и мне не страшно сказать своё мнение. Спасибо, что со мной договорились.",
  },
  natural_child: {
    low: "Скукота! Опять списки и правила. Я на такое не подпишусь.",
    mid: "Местами норм, местами скучно. Можно добавить больше игры и наград?",
    high: "О, тут и цели, и награды, и мини-победы! Давайте начинать, я в деле!",
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
      ? `✅ Цель ${g} реалистична: рост ${g - mock} баллов за 12 недель выполним.`
      : g <= mock
        ? `❌ Цель ${g} не выше стартового балла ${mock}. Нужен рост хотя бы на 15 баллов.`
        : g < lo
          ? `⚠️ Цель ${g} слишком скромная: можно ставить ${lo}–${hi}.`
          : `⚠️ Цель ${g} слишком амбициозна для 12 недель (разумно до ${hi}): риск разочарования и стресса.`,
  );
  if (!plan.focus.length) expert.push("❌ Не выбраны приоритетные проблемные зоны.");
  else if (reveal) expert.push(`${focusHits === 3 ? "✅" : "⚠️"} Совпало приоритетов: ${focusHits} из 3. Главные зоны ученика: ${top.map((p) => PROBLEMS[p]).join(", ")}.`);
  else expert.push(`${focusHits === 3 ? "✅" : "⚠️"} Совпало приоритетов: ${focusHits} из 3. Точные зоны откроются, когда профиль станет известен.`);
  if (!chosen.length) expert.push("❌ В плане нет ни одного приёма из воркбуков.");
  else expert.push(`${fit >= 0.65 ? "✅" : fit >= 0.4 ? "⚠️" : "❌"} Подходящесть приёмов этому ученику: ${parts.fit}%.`);
  const weak = chosen.filter((x) => interventionFit(student, x.iv, x.stage) < 0.4);
  if (weak.length) expert.push(`Слабее всего подходят: ${weak.slice(0, 3).map((x) => `«${x.iv.title}» (${ivSource(x.iv)})`).join(", ")}.`);
  const missing = STAGES.filter((s) => !plan.steps[s.id].interventionIds.length).map((s) => s.name);
  if (missing.length) expert.push(`⚠️ Не заполнены этапы: ${missing.join(", ")}.`);
  if (plan.metrics.trim().length < 20) expert.push("⚠️ Опишите метрики успеха: что именно будет считаться прогрессом (баллы пробников, режим, стресс).");
  if (plan.message.trim().length < 20) expert.push("⚠️ Добавьте, что именно вы скажете ученику: план должен быть озвучен и согласован с ним.");
  if (needsFamily && plan.family.trim().length < 15) expert.push("⚠️ Для такой семьи нужен продуманный план работы с родителями.");
  expert.push(
    plan.tone == null
      ? "❌ Не выбран тон общения."
      : tone >= 0.75
        ? `✅ Тон «${TONES[plan.tone].name}» подходит ученику.`
        : `⚠️ Ученику ближе тон «${TONES[bestTone(student, c.trust)].name}».`,
  );
  const recs = INTERVENTIONS.filter((iv) => !chosen.some((x) => x.iv.id === iv.id))
    .map((iv) => ({ iv, f: interventionFit(student, iv) }))
    .sort((a, b) => b.f - a.f)
    .slice(0, 3);
  expert.push(`Что стоило бы добавить: ${recs.map((r) => `«${r.iv.title}» (${ivSource(r.iv)})`).join(", ")}.`);
  if (reveal) expert.push(`Ориентир ALQA для «${egoInfo.name}»: ${egoInfo.motivate[0].toLowerCase()}.`);

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
