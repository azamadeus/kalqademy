import { EGO } from "../data/ego";
import { FINAL_VOICE, TONE_TAIL } from "../data/voices";
import { TYPES } from "../data/mbti";
import { bestTone, dominantEgo, preferredWarmth, topTactics, woundOf } from "./engine";
import { WOUNDS } from "../data/wounds";
import { TACTICS, TONES, fmt } from "./text";
import type { CaseState, ReportInput, ReportResult, Student } from "./types";

const PAIRS = ["EI", "SN", "TF", "JP"] as const;

export function evaluateReport(student: Student, c: CaseState, input: ReportInput, at: number): ReportResult {
  const truth = student.mbti.split("");
  let lettersCorrect = 0;
  PAIRS.forEach((p, i) => {
    if (input.letters[p] === truth[i]) lettersCorrect++;
  });
  const ego = dominantEgo(student);
  const egoCorrect = input.ego === ego;
  const best = bestTone(student, c.trust);
  const toneScore = input.tone == null ? 0 : Math.max(0, 1 - Math.abs(input.tone - preferredWarmth(student, c.trust)) / 3);
  const top = topTactics(student, 2);
  const tacticsHit = input.tactics.filter((t) => top.includes(t)).length;
  const wound = woundOf(student);
  const woundCorrect = input.wound === wound;
  const score = Math.round((lettersCorrect / 4) * 30 + (egoCorrect ? 20 : 0) + toneScore * 15 + (tacticsHit / 2) * 15 + (woundCorrect ? 20 : 0));

  const band = c.trust >= 65 ? "high" : c.trust >= 35 ? "mid" : "low";
  const toneOk = input.tone != null && Math.abs(input.tone - preferredWarmth(student, c.trust)) <= 0.8;
  const avgTone = c.tones.length ? c.tones.reduce((a, b) => a + b, 0) / c.tones.length : 1.5;
  const diff = avgTone - preferredWarmth(student, c.trust);
  const tail = Math.abs(diff) <= 0.7 ? TONE_TAIL.ok : diff < 0 ? TONE_TAIL.warmer : TONE_TAIL.cooler;
  const studentMessage = fmt(FINAL_VOICE[ego][band] + tail, student);

  const info = EGO[ego];
  const expert: string[] = [];
  if (egoCorrect) expert.push(`✅ Эго-состояние определено верно: ${info.name}.`);
  else expert.push(`❌ Доминирует ${info.name} (вы указали ${input.ego ? EGO[input.ego].name : "ничего"}). Признаки: ${info.signs[0].toLowerCase()}.`);
  if (lettersCorrect === 4) expert.push(`✅ Тип ${student.mbti} («${TYPES[student.mbti].nick}») определён точно.`);
  else expert.push(`❌ Верный тип: ${student.mbti} («${TYPES[student.mbti].nick}»), угадано букв: ${lettersCorrect} из 4.`);
  expert.push(
    toneOk
      ? `✅ Тон «${TONES[input.tone!].name}» подходит ученику.`
      : `❌ Ученику лучше подходит тон «${TONES[best].name}». ${TONES[best].desc}.`,
  );
  expert.push(
    tacticsHit === 2
      ? `✅ Обе тактики выбраны верно.`
      : `Лучше всего работают: ${top.map((t) => `${TACTICS[t].icon} ${TACTICS[t].name}`).join(" и ")}.`,
  );
  expert.push(
    woundCorrect
      ? `✅ Чувствительная тема определена верно: «${WOUNDS[wound].name}».`
      : input.wound
        ? `❌ Скорее всего, чувствительная тема «${WOUNDS[wound].name}» (вы указали «${WOUNDS[input.wound].name}»). Признаки: ${WOUNDS[wound].signs[0].toLowerCase()}.`
        : `Чувствительная тема не указана. Вероятнее всего: «${WOUNDS[wound].name}». Что помогает: ${WOUNDS[wound].works[0].toLowerCase()}.`,
  );
  expert.push(`Как мотивировать: ${info.motivate[0].toLowerCase()}.`);
  expert.push(`Что стоит говорить: ${info.say[0]}`);
  if (TYPES[student.mbti].works[0]) expert.push(`Для типа ${student.mbti}: ${TYPES[student.mbti].works[0].toLowerCase()}.`);

  return {
    at,
    week: c.week,
    input,
    score,
    lettersCorrect,
    egoCorrect,
    woundCorrect,
    toneScore: Math.round(toneScore * 100),
    tacticsHit,
    studentMessage,
    expert,
    xp: 5 + Math.round(score / 4),
  };
}
