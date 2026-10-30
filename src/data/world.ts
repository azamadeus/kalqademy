import type { ProblemKey } from "../game/types";
import { tr } from "../i18n";

export interface Family {
  id: string;
  label: string;
  icon: string;
  desc: string;
  /** Base weekly stress contributed by home. */
  stress: number;
  /** Answer when the student is asked what they say at home about ENT. */
  voice: string;
  /** Which kinds of events this family boosts. */
  boosts: ProblemKey[];
}

export const FAMILIES: Family[] = [
  { id: "pressure", label: tr("Родители давят на «престижную» профессию"), icon: "🏛️", desc: tr("Родители уже выбрали профессию за ребёнка и считают баллы."), stress: 5, voice: tr("Дома говорят одно: «Ты обязан на грант и на нужную профессию». Каждый день спрашивают баллы."), boosts: ["family", "anxiety", "goal"] },
  { id: "busy", label: tr("Родители заняты работой"), icon: "💼", desc: tr("Любят, но дома почти не бывают и не вникают в подготовку."), stress: 1, voice: tr("Дома особо не обсуждают. Родители на работе допоздна, спрашивают только «ну как?»."), boosts: ["motivation", "social"] },
  { id: "single", label: tr("Растёт с мамой, помогает по дому"), icon: "🏠", desc: tr("Мама одна, ученик берёт на себя быт и ответственность."), stress: 3, voice: tr("Мама одна, я помогаю по дому и с младшими. Мама говорит: «Только не подведи»."), boosts: ["burnout", "boundaries", "money"] },
  { id: "siblings", label: tr("Присматривает за младшими"), icon: "👧", desc: tr("Много времени уходит на братьев и сестёр."), stress: 3, voice: tr("После школы мне надо забирать младших. На учёбу остаётся вечер, если не засну."), boosts: ["burnout", "discipline"] },
  { id: "tight", label: tr("Курс купили в кредит или в ущерб бюджету"), icon: "💳", desc: tr("Деньги на курс семья нашла с трудом, ждут отдачи."), stress: 4, voice: tr("Родители за курс заплатили много, я чувствую, что не имею права проиграть."), boosts: ["money", "course", "anxiety"] },
  { id: "overprotect", label: tr("Гиперопека и контроль"), icon: "🔒", desc: tr("Родители проверяют телефон, расписание и друзей."), stress: 4, voice: tr("Мама проверяет, во сколько я сел и когда встал. Мне как будто не доверяют."), boosts: ["boundaries", "family", "discipline"] },
  { id: "compare", label: tr("Сравнивают с двоюродным братом/сестрой"), icon: "📊", desc: tr("В семье любят вспоминать, кто какой балл набрал."), stress: 4, voice: tr("На семейных ужинах сравнивают: у двоюродного брата 130 баллов. А у меня?"), boosts: ["comparison", "perfectionism", "anxiety"] },
  { id: "divorce", label: tr("Напряжённая обстановка дома"), icon: "⛈️", desc: tr("Ссоры, развод или трудный период в семье."), stress: 5, voice: tr("Дома сейчас сложно, ссоры. Я закрываюсь в наушниках, чтобы заниматься."), boosts: ["burnout", "motivation", "social"] },
  { id: "village", label: tr("Из села, слабая школа и связь"), icon: "🌾", desc: tr("Нестабильный интернет, школа без сильных учителей."), stress: 3, voice: tr("У нас интернет плохой, на видеоуроках зависает. Школа слабая, надеяться только на курс."), boosts: ["course", "anxiety", "comparison"] },
  { id: "supportive", label: tr("Поддерживающая семья"), icon: "🌿", desc: tr("Родители помогают, но не давят. Хорошая опора."), stress: -1, voice: tr("Дома поддерживают, говорят: «Главное — старайся». Мне это помогает."), boosts: ["goal", "discipline"] },
];

export const familyById = (id: string) => FAMILIES.find((f) => f.id === id) ?? FAMILIES[0];

export interface Course {
  id: string;
  name: string;
  price: string;
  format: string;
  by: "self" | "parents" | "relative";
  voice: string;
}

export const COURSES: Course[] = [
  { id: "c1", name: tr("ЕНТ-интенсив 90 дней"), price: "180 000 ₸", format: tr("Записи + чат с куратором"), by: "parents", voice: tr("Родители увидели рекламу и купили. Сказали: «Сиди и занимайся». Меня особо не спрашивали.") },
  { id: "c2", name: tr("Грант 140"), price: "250 000 ₸", format: tr("Живые уроки + проверка ДЗ"), by: "self", voice: tr("Я сам выбрал: насмотрелся историй про 140 баллов. Хотел начать всё с чистого листа.") },
  { id: "c3", name: tr("ЕНТ Pro: профильные предметы"), price: "120 000 ₸", format: tr("Записи + пробники"), by: "relative", voice: tr("Дядя посоветовал, у его знакомого сын поступил после этого курса.") },
  { id: "c4", name: tr("Ready ЕНТ"), price: "95 000 ₸", format: tr("Мини-группа + куратор"), by: "self", voice: tr("Взял подешевле: денег немного. Хочу понять, стоит ли оно того.") },
  { id: "c5", name: tr("Академия ЕНТ Online"), price: "210 000 ₸", format: tr("Платформа + геймификация"), by: "parents", voice: tr("Родители купили, потому что у соседей дети поступили. Они ждут результата.") },
];

export const courseById = (id: string) => COURSES.find((c) => c.id === id) ?? COURSES[0];

export interface Goal {
  id: string;
  profession: string;
  uni: string;
  subjects: string;
  icon: string;
}

export const GOALS: Goal[] = [
  { id: "med", profession: tr("Врач"), uni: tr("КазНМУ, Астана Медицинский"), subjects: tr("Биология + Химия"), icon: "🩺" },
  { id: "it", profession: tr("IT-разработчик"), uni: "Astana IT University", subjects: tr("Математика + Информатика"), icon: "💻" },
  { id: "law", profession: tr("Юрист"), uni: tr("КазНУ им. аль-Фараби"), subjects: tr("История + Право"), icon: "⚖️" },
  { id: "ped", profession: tr("Учитель"), uni: tr("КазНПУ им. Абая"), subjects: tr("Профильные по выбору"), icon: "📚" },
  { id: "eng", profession: tr("Инженер"), uni: "Satbayev University", subjects: tr("Математика + Физика"), icon: "⚙️" },
  { id: "ir", profession: tr("Международные отношения"), uni: tr("КазУМОиМЯ"), subjects: tr("История + Иностранный язык"), icon: "🌍" },
  { id: "jour", profession: tr("Журналист"), uni: tr("КазНУ, журналистика"), subjects: tr("Творческий + Язык"), icon: "🎙️" },
  { id: "eco", profession: tr("Экономист"), uni: tr("КазЭУ им. Рыскулова"), subjects: tr("Математика + География"), icon: "📈" },
  { id: "design", profession: tr("Дизайнер"), uni: tr("Творческий вуз"), subjects: tr("Творческий экзамен"), icon: "🎨" },
  { id: "psy", profession: tr("Психолог"), uni: tr("КазНУ, психология"), subjects: tr("Биология + Человек. Общество. Право"), icon: "🧩" },
];

export const goalById = (id: string) => GOALS.find((g) => g.id === id) ?? GOALS[0];

export const NAMES = {
  f: [tr("Айгерим"), tr("Мадина"), tr("Томирис"), tr("Дана"), tr("Аружан"), tr("Асем"), tr("Зарина"), tr("Малика"), tr("Жанель"), tr("Алия"), tr("Камила"), tr("Айым")],
  m: [tr("Данияр"), tr("Алихан"), tr("Тимур"), tr("Ерасыл"), tr("Азамат"), tr("Нурбол"), tr("Али"), tr("Арман"), tr("Бекзат"), tr("Мирас"), tr("Руслан"), tr("Динмухаммед")],
};

export const CITIES = [tr("Астана"), tr("Алматы"), tr("Шымкент"), tr("Караганда"), tr("Актобе"), tr("Тараз"), tr("Павлодар"), tr("Семей"), tr("Кызылорда"), tr("Туркестан"), tr("село в Алматинской обл."), tr("село в Жамбылской обл.")];

export const PROBLEMS: Record<ProblemKey, string> = {
  motivation: tr("Падение мотивации"),
  anxiety: tr("Тревога перед ЕНТ"),
  perfectionism: tr("Перфекционизм"),
  family: tr("Давление семьи"),
  course: tr("Разочарование в курсе"),
  burnout: tr("Выгорание и усталость"),
  comparison: tr("Сравнение с другими"),
  goal: tr("Сомнения в выборе профессии"),
  boundaries: tr("Трудно сказать «нет»"),
  discipline: tr("Дисциплина и режим"),
  money: tr("Деньги и ожидания семьи"),
  social: tr("Одиночество и общение"),
};
