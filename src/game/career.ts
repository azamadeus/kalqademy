import type { Curator, GameState, SkillKey } from "./types";
import { tr } from "../i18n";

export const SKILLS: Record<SkillKey, { name: string; icon: string; desc: string }> = {
  empathy: { name: tr("Эмпатия"), icon: "💚", desc: tr("Слышать чувства и называть их") },
  structure: { name: tr("Структура"), icon: "🗺️", desc: tr("Планы, режим, измеримые шаги") },
  motivation: { name: tr("Мотивация"), icon: "🔥", desc: tr("Смысл, цели, игра и награды") },
  boundaries: { name: tr("Границы"), icon: "🛡️", desc: tr("Честность, паузы, умение не давить") },
  family: { name: tr("Работа с семьёй"), icon: "👪", desc: tr("Диалог с родителями, снятие давления") },
  diagnostics: { name: tr("Диагностика"), icon: "🔍", desc: tr("Видеть тип, эго-состояние и тон") },
};

export const RANKS = [
  { level: 1, name: tr("Стажёр") },
  { level: 2, name: tr("Младший куратор") },
  { level: 3, name: tr("Куратор") },
  { level: 4, name: tr("Старший куратор") },
  { level: 5, name: tr("Наставник") },
  { level: 6, name: tr("Ментор") },
  { level: 7, name: tr("Мастер-наставник") },
];

export const PERKS: { level: number; icon: string; name: string; desc: string }[] = [
  { level: 1, icon: "💬", name: tr("2 вопроса в неделю"), desc: tr("Можно задать ученику два вопроса за неделю") },
  { level: 2, icon: "➕", name: tr("3-й вопрос"), desc: tr("Ещё один вопрос в неделю") },
  { level: 3, icon: "🔮", name: tr("Профессиональная интуиция"), desc: tr("Раз за ученика можно раскрыть одну букву MBTI") },
  { level: 4, icon: "🧭", name: tr("Компас тона"), desc: tr("Видно, какой тон ученик предпочитает прямо сейчас") },
  { level: 5, icon: "➕", name: tr("4-й вопрос"), desc: tr("Ещё один вопрос в неделю") },
  { level: 6, icon: "✨", name: tr("Чутьё тактики"), desc: tr("Подсветка самой подходящей тактики") },
  { level: 7, icon: "👑", name: tr("Мастер диагностики"), desc: tr("Эго-состояние ученика раскрывается автоматически") },
];

export const xpForLevel = (level: number) => 40 + (level - 1) * 25;

export function levelOf(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let rest = xp;
  while (rest >= xpForLevel(level)) {
    rest -= xpForLevel(level);
    level++;
  }
  return { level, into: rest, need: xpForLevel(level) };
}

export const rankOf = (level: number) => RANKS.slice().reverse().find((r) => level >= r.level)!;

export const questionsPerWeek = (level: number) => 2 + (level >= 2 ? 1 : 0) + (level >= 5 ? 1 : 0);

export const emptyCurator = (name = tr("Куратор")): Curator => ({
  name,
  xp: 0,
  skills: { empathy: 0, structure: 0, motivation: 0, boundaries: 0, family: 0, diagnostics: 0 },
  casesFinished: 0,
});

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  check: (g: GameState) => boolean;
}

const cases = (g: GameState) => Object.values(g.cases);

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", icon: "👋", name: tr("Первый контакт"), desc: tr("Ответить ученику в первый раз"), check: (g) => cases(g).some((c) => c.last) },
  { id: "warm", icon: "💚", name: tr("Тёплые отношения"), desc: tr("Довести отношения до уровня «Очень тёплые»"), check: (g) => cases(g).some((c) => c.trust >= 75) },
  { id: "group", icon: "👥", name: tr("Своя группа"), desc: tr("Собрать группу из 5 учеников"), check: (g) => g.students.length >= 5 },
  { id: "diag", icon: "🔍", name: tr("Диагност"), desc: tr("Точно определить MBTI и эго-состояние в отчёте"), check: (g) => cases(g).some((c) => c.reports.some((r) => r.lettersCorrect === 4 && r.egoCorrect)) },
  { id: "calm", icon: "🧘", name: tr("Без паники"), desc: tr("Закончить сезон со стрессом ученика ≤ 35"), check: (g) => cases(g).some((c) => c.finished && c.stress <= 35) },
  { id: "grant", icon: "🎓", name: tr("Грант в кармане"), desc: tr("Ученик набрал 100+ баллов на ЕНТ"), check: (g) => cases(g).some((c) => (c.finalScore ?? 0) >= 100) },
  { id: "top", icon: "🏆", name: tr("Высший балл"), desc: tr("Ученик набрал 120+ баллов"), check: (g) => cases(g).some((c) => (c.finalScore ?? 0) >= 120) },
  { id: "levelup", icon: "⭐", name: tr("Растущий наставник"), desc: tr("Достичь 5 уровня куратора"), check: (g) => levelOf(g.curator.xp).level >= 5 },
  { id: "plan", icon: "🧭", name: tr("Архитектор развития"), desc: tr("Составить план развития на 80+ баллов"), check: (g) => cases(g).some((c) => (c.planResult?.score ?? 0) >= 80) },
  { id: "streak", icon: "🔥", name: tr("Серия"), desc: tr("3 отличных хода подряд"), check: (g) => cases(g).some((c) => { let n = 0; for (const h of c.history ?? []) { n = h.quality === "great" ? n + 1 : 0; if (n >= 3) return true; } return false; }) },
  { id: "safe", icon: "🛟", name: tr("Безопасный ход"), desc: tr("Правильно отреагировать на тревожный сигнал"), check: (g) => cases(g).some((c) => (c.history ?? []).some((h) => h.eventId === "alarm" && (h.quality === "great" || h.quality === "good"))) },
  { id: "tone", icon: "🎚️", name: tr("Мастер тона"), desc: tr("10 ходов в одном сезоне с точным тоном"), check: (g) => cases(g).some((c) => (c.history ?? []).filter((h) => h.toneOk).length >= 10) },
  { id: "nolosses", icon: "💎", name: tr("Без потерь"), desc: tr("Закончить сезон с доверием от 75 и стрессом до 40"), check: (g) => cases(g).some((c) => c.finished && c.trust >= 75 && c.stress <= 40) },
  { id: "three", icon: "📋", name: tr("Опыт в деле"), desc: tr("Завершить 3 сезона с учениками"), check: (g) => g.curator.casesFinished >= 3 },
];
