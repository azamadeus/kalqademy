import type { Curator, GameState, SkillKey } from "./types";

export const SKILLS: Record<SkillKey, { name: string; icon: string; desc: string }> = {
  empathy: { name: "Эмпатия", icon: "💚", desc: "Слышать чувства и называть их" },
  structure: { name: "Структура", icon: "🗺️", desc: "Планы, режим, измеримые шаги" },
  motivation: { name: "Мотивация", icon: "🔥", desc: "Смысл, цели, игра и награды" },
  boundaries: { name: "Границы", icon: "🛡️", desc: "Честность, паузы, умение не давить" },
  family: { name: "Работа с семьёй", icon: "👪", desc: "Диалог с родителями, снятие давления" },
  diagnostics: { name: "Диагностика", icon: "🔍", desc: "Видеть тип, эго-состояние и тон" },
};

export const RANKS = [
  { level: 1, name: "Стажёр" },
  { level: 2, name: "Младший куратор" },
  { level: 3, name: "Куратор" },
  { level: 4, name: "Старший куратор" },
  { level: 5, name: "Наставник" },
  { level: 6, name: "Ментор" },
  { level: 7, name: "Мастер-наставник" },
];

export const PERKS: { level: number; icon: string; name: string; desc: string }[] = [
  { level: 1, icon: "💬", name: "2 вопроса в неделю", desc: "Можно задать ученику два вопроса за неделю" },
  { level: 2, icon: "➕", name: "3-й вопрос", desc: "Ещё один вопрос в неделю" },
  { level: 3, icon: "🔮", name: "Профессиональная интуиция", desc: "Раз за ученика можно раскрыть одну букву MBTI" },
  { level: 4, icon: "🧭", name: "Компас тона", desc: "Видно, какой тон ученик предпочитает прямо сейчас" },
  { level: 5, icon: "➕", name: "4-й вопрос", desc: "Ещё один вопрос в неделю" },
  { level: 6, icon: "✨", name: "Чутьё тактики", desc: "Подсветка самой подходящей тактики" },
  { level: 7, icon: "👑", name: "Мастер диагностики", desc: "Эго-состояние ученика раскрывается автоматически" },
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

export const emptyCurator = (name = "Куратор"): Curator => ({
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
  { id: "first", icon: "👋", name: "Первый контакт", desc: "Ответить ученику в первый раз", check: (g) => cases(g).some((c) => c.last) },
  { id: "warm", icon: "💚", name: "Тёплые отношения", desc: "Довести отношения до уровня «Очень тёплые»", check: (g) => cases(g).some((c) => c.trust >= 75) },
  { id: "group", icon: "👥", name: "Своя группа", desc: "Собрать группу из 5 учеников", check: (g) => g.students.length >= 5 },
  { id: "diag", icon: "🔍", name: "Диагност", desc: "Точно определить MBTI и эго-состояние в отчёте", check: (g) => cases(g).some((c) => c.reports.some((r) => r.lettersCorrect === 4 && r.egoCorrect)) },
  { id: "calm", icon: "🧘", name: "Без паники", desc: "Закончить сезон со стрессом ученика ≤ 35", check: (g) => cases(g).some((c) => c.finished && c.stress <= 35) },
  { id: "grant", icon: "🎓", name: "Грант в кармане", desc: "Ученик набрал 100+ баллов на ЕНТ", check: (g) => cases(g).some((c) => (c.finalScore ?? 0) >= 100) },
  { id: "top", icon: "🏆", name: "Высший балл", desc: "Ученик набрал 120+ баллов", check: (g) => cases(g).some((c) => (c.finalScore ?? 0) >= 120) },
  { id: "levelup", icon: "⭐", name: "Растущий наставник", desc: "Достичь 5 уровня куратора", check: (g) => levelOf(g.curator.xp).level >= 5 },
  { id: "three", icon: "📋", name: "Опыт в деле", desc: "Завершить 3 сезона с учениками", check: (g) => g.curator.casesFinished >= 3 },
];
