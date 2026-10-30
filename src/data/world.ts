import type { ProblemKey } from "../game/types";

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
  { id: "pressure", label: "Родители давят на «престижную» профессию", icon: "🏛️", desc: "Родители уже выбрали профессию за ребёнка и считают баллы.", stress: 5, voice: "Дома говорят одно: «Ты обязан на грант и на нужную профессию». Каждый день спрашивают баллы.", boosts: ["family", "anxiety", "goal"] },
  { id: "busy", label: "Родители заняты работой", icon: "💼", desc: "Любят, но дома почти не бывают и не вникают в подготовку.", stress: 1, voice: "Дома особо не обсуждают. Родители на работе допоздна, спрашивают только «ну как?».", boosts: ["motivation", "social"] },
  { id: "single", label: "Растёт с мамой, помогает по дому", icon: "🏠", desc: "Мама одна, ученик берёт на себя быт и ответственность.", stress: 3, voice: "Мама одна, я помогаю по дому и с младшими. Мама говорит: «Только не подведи».", boosts: ["burnout", "boundaries", "money"] },
  { id: "siblings", label: "Присматривает за младшими", icon: "👧", desc: "Много времени уходит на братьев и сестёр.", stress: 3, voice: "После школы мне надо забирать младших. На учёбу остаётся вечер, если не засну.", boosts: ["burnout", "discipline"] },
  { id: "tight", label: "Курс купили в кредит или в ущерб бюджету", icon: "💳", desc: "Деньги на курс семья нашла с трудом, ждут отдачи.", stress: 4, voice: "Родители за курс заплатили много, я чувствую, что не имею права проиграть.", boosts: ["money", "course", "anxiety"] },
  { id: "overprotect", label: "Гиперопека и контроль", icon: "🔒", desc: "Родители проверяют телефон, расписание и друзей.", stress: 4, voice: "Мама проверяет, во сколько я сел и когда встал. Мне как будто не доверяют.", boosts: ["boundaries", "family", "discipline"] },
  { id: "compare", label: "Сравнивают с двоюродным братом/сестрой", icon: "📊", desc: "В семье любят вспоминать, кто какой балл набрал.", stress: 4, voice: "На семейных ужинах сравнивают: у двоюродного брата 130 баллов. А у меня?", boosts: ["comparison", "perfectionism", "anxiety"] },
  { id: "divorce", label: "Напряжённая обстановка дома", icon: "⛈️", desc: "Ссоры, развод или трудный период в семье.", stress: 5, voice: "Дома сейчас сложно, ссоры. Я закрываюсь в наушниках, чтобы заниматься.", boosts: ["burnout", "motivation", "social"] },
  { id: "village", label: "Из села, слабая школа и связь", icon: "🌾", desc: "Нестабильный интернет, школа без сильных учителей.", stress: 3, voice: "У нас интернет плохой, на видеоуроках зависает. Школа слабая, надеяться только на курс.", boosts: ["course", "anxiety", "comparison"] },
  { id: "supportive", label: "Поддерживающая семья", icon: "🌿", desc: "Родители помогают, но не давят. Хорошая опора.", stress: -1, voice: "Дома поддерживают, говорят: «Главное — старайся». Мне это помогает.", boosts: ["goal", "discipline"] },
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
  { id: "c1", name: "ЕНТ-интенсив 90 дней", price: "180 000 ₸", format: "Записи + чат с куратором", by: "parents", voice: "Родители увидели рекламу и купили. Сказали: «Сиди и занимайся». Меня особо не спрашивали." },
  { id: "c2", name: "Грант 140", price: "250 000 ₸", format: "Живые уроки + проверка ДЗ", by: "self", voice: "Я сам выбрал: насмотрелся историй про 140 баллов. Хотел начать всё с чистого листа." },
  { id: "c3", name: "ЕНТ Pro: профильные предметы", price: "120 000 ₸", format: "Записи + пробники", by: "relative", voice: "Дядя посоветовал, у его знакомого сын поступил после этого курса." },
  { id: "c4", name: "Ready ЕНТ", price: "95 000 ₸", format: "Мини-группа + куратор", by: "self", voice: "Взял подешевле: денег немного. Хочу понять, стоит ли оно того." },
  { id: "c5", name: "Академия ЕНТ Online", price: "210 000 ₸", format: "Платформа + геймификация", by: "parents", voice: "Родители купили, потому что у соседей дети поступили. Они ждут результата." },
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
  { id: "med", profession: "Врач", uni: "КазНМУ, Астана Медицинский", subjects: "Биология + Химия", icon: "🩺" },
  { id: "it", profession: "IT-разработчик", uni: "Astana IT University", subjects: "Математика + Информатика", icon: "💻" },
  { id: "law", profession: "Юрист", uni: "КазНУ им. аль-Фараби", subjects: "История + Право", icon: "⚖️" },
  { id: "ped", profession: "Учитель", uni: "КазНПУ им. Абая", subjects: "Профильные по выбору", icon: "📚" },
  { id: "eng", profession: "Инженер", uni: "Satbayev University", subjects: "Математика + Физика", icon: "⚙️" },
  { id: "ir", profession: "Международные отношения", uni: "КазУМОиМЯ", subjects: "История + Иностранный язык", icon: "🌍" },
  { id: "jour", profession: "Журналист", uni: "КазНУ, журналистика", subjects: "Творческий + Язык", icon: "🎙️" },
  { id: "eco", profession: "Экономист", uni: "КазЭУ им. Рыскулова", subjects: "Математика + География", icon: "📈" },
  { id: "design", profession: "Дизайнер", uni: "Творческий вуз", subjects: "Творческий экзамен", icon: "🎨" },
  { id: "psy", profession: "Психолог", uni: "КазНУ, психология", subjects: "Биология + Человек. Общество. Право", icon: "🧩" },
];

export const goalById = (id: string) => GOALS.find((g) => g.id === id) ?? GOALS[0];

export const NAMES = {
  f: ["Айгерим", "Мадина", "Томирис", "Дана", "Аружан", "Асем", "Зарина", "Малика", "Жанель", "Алия", "Камила", "Айым"],
  m: ["Данияр", "Алихан", "Тимур", "Ерасыл", "Азамат", "Нурбол", "Али", "Арман", "Бекзат", "Мирас", "Руслан", "Динмухаммед"],
};

export const CITIES = ["Астана", "Алматы", "Шымкент", "Караганда", "Актобе", "Тараз", "Павлодар", "Семей", "Кызылорда", "Туркестан", "село в Алматинской обл.", "село в Жамбылской обл."];

export const PROBLEMS: Record<ProblemKey, string> = {
  motivation: "Падение мотивации",
  anxiety: "Тревога перед ЕНТ",
  perfectionism: "Перфекционизм",
  family: "Давление семьи",
  course: "Разочарование в курсе",
  burnout: "Выгорание и усталость",
  comparison: "Сравнение с другими",
  goal: "Сомнения в выборе профессии",
  boundaries: "Трудно сказать «нет»",
  discipline: "Дисциплина и режим",
  money: "Деньги и ожидания семьи",
  social: "Одиночество и общение",
};
