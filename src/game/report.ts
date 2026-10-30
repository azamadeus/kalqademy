import { EGO } from "../data/ego";
import { FINAL_VOICE, TONE_TAIL } from "../data/voices";
import { TYPES } from "../data/mbti";
import { bestTone, dominantEgo, preferredWarmth, topTactics, woundOf } from "./engine";
import { WOUNDS } from "../data/wounds";
import { TACTICS, TONES, fmt } from "./text";
import type { CaseState, ReportInput, ReportResult, Student } from "./types";
import { tr } from "../i18n";

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
  if (egoCorrect) expert.push(tr("✅ Эго-состояние определено верно: {v}.", { v: info.name }));
  else expert.push(tr("❌ Доминирует {v} (вы указали {v2}). Признаки: {v3}.", { v: info.name, v2: input.ego ? EGO[input.ego].name : tr("ничего"), v3: info.signs[0].toLowerCase() }));
  if (lettersCorrect === 4) expert.push(tr("✅ Тип {mbti} («{nick}») определён точно.", { mbti: student.mbti, nick: TYPES[student.mbti].nick }));
  else expert.push(tr("❌ Верный тип: {mbti} («{nick}»), угадано букв: {lettersCorrect} из 4.", { mbti: student.mbti, nick: TYPES[student.mbti].nick, lettersCorrect }));
  expert.push(
    toneOk
      ? tr("✅ Тон «{v}» подходит ученику.", { v: TONES[input.tone!].name })
      : tr("❌ Ученику лучше подходит тон «{v}». {desc}.", { v: TONES[best].name, desc: TONES[best].desc }),
  );
  expert.push(
    tacticsHit === 2
      ? tr("✅ Обе тактики выбраны верно.")
      : tr("Лучше всего работают: {list}.", { list: top.map((x) => `${TACTICS[x].icon} ${TACTICS[x].name}`).join(tr(" и ")) }),
  );
  expert.push(
    woundCorrect
      ? tr("✅ Чувствительная тема определена верно: «{v}».", { v: WOUNDS[wound].name })
      : input.wound
        ? tr("❌ Скорее всего, чувствительная тема «{v}» (вы указали «{v2}»). Признаки: {v3}.", { v: WOUNDS[wound].name, v2: WOUNDS[input.wound].name, v3: WOUNDS[wound].signs[0].toLowerCase() })
        : tr("Чувствительная тема не указана. Вероятнее всего: «{v}». Что помогает: {v2}.", { v: WOUNDS[wound].name, v2: WOUNDS[wound].works[0].toLowerCase() }),
  );
  expert.push(tr("Как мотивировать: {v}.", { v: info.motivate[0].toLowerCase() }));
  expert.push(tr("Что стоит говорить: {say}", { say: info.say[0] }));
  if (TYPES[student.mbti].works[0]) expert.push(tr("Для типа {mbti}: {v}.", { mbti: student.mbti, v: TYPES[student.mbti].works[0].toLowerCase() }));

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
