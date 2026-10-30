import type { Student } from "../game/types";

export const students: Student[] = [
  {
    id: "aigerim",
    name: "Айгерим",
    age: 16,
    mbti: "ENFP",
    ego: { parent: 15, adult: 30, child: 55 },
    goal: "Грант на журналистику",
    bio: "Яркая и общительная, загорается идеями, но быстро переключается. Нужна рамка, которая не душит.",
    start: { trust: 45, motivation: 55, stress: 35 },
  },
  {
    id: "daniyar",
    name: "Данияр",
    age: 17,
    mbti: "ISTJ",
    ego: { parent: 45, adult: 45, child: 10 },
    goal: "Грант на инженерию",
    bio: "Дисциплинированный, любит чёткие планы и факты. Плохо переносит неопределённость.",
    start: { trust: 40, motivation: 60, stress: 40 },
  },
  {
    id: "madina",
    name: "Мадина",
    age: 17,
    mbti: "INFJ",
    ego: { parent: 55, adult: 30, child: 15 },
    goal: "Медицина (выбор родителей)",
    bio: "Чуткая перфекционистка. Живёт «как надо», сама не уверена, чего хочет.",
    start: { trust: 35, motivation: 45, stress: 55 },
  },
  {
    id: "alikhan",
    name: "Алихан",
    age: 16,
    mbti: "ESTP",
    ego: { parent: 20, adult: 30, child: 50 },
    goal: "IT, программирование",
    bio: "Энергичный, любит действовать здесь и сейчас. Скучные задачи откладывает до последнего.",
    start: { trust: 40, motivation: 50, stress: 30 },
  },
  {
    id: "zarina",
    name: "Зарина",
    age: 17,
    mbti: "INTJ",
    ego: { parent: 25, adult: 65, child: 10 },
    goal: "Зарубежный вуз",
    bio: "Самостоятельная и стратегичная. Не терпит пустых разговоров и давления без логики.",
    start: { trust: 30, motivation: 70, stress: 35 },
  },
  {
    id: "timur",
    name: "Тимур",
    age: 16,
    mbti: "ISFP",
    ego: { parent: 15, adult: 25, child: 60 },
    goal: "Дизайн",
    bio: "Тихий и творческий, тревожно реагирует на критику. Открывается только тем, кому доверяет.",
    start: { trust: 25, motivation: 50, stress: 50 },
  },
];

export const studentById = (id: string) => {
  const s = students.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown student: ${id}`);
  return s;
};
