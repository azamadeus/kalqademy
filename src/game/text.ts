import type { Student, Tactic, Tone } from "./types";
import { goalById } from "../data/world";

export const TONES: { id: Tone; name: string; icon: string; desc: string }[] = [
  { id: 0, name: "Отстранённо", icon: "❄️", desc: "Деловой тон, дистанция, только факты" },
  { id: 1, name: "Нейтрально", icon: "🙂", desc: "Спокойно и вежливо, без лишних эмоций" },
  { id: 2, name: "Хорошо", icon: "😊", desc: "Дружелюбно, заметно участие и поддержка" },
  { id: 3, name: "Очень тепло", icon: "🤗", desc: "Близко и искренне, как с родным человеком" },
];

export const CLOSENESS = [
  { name: "Отстранённые", icon: "❄️", from: 0, hint: "Вы пока чужие люди" },
  { name: "Нейтральные", icon: "🙂", from: 25, hint: "Рабочий контакт, есть уважение" },
  { name: "Хорошие", icon: "😊", from: 50, hint: "Доверие и открытость" },
  { name: "Очень тёплые", icon: "💚", from: 75, hint: "Истинно близкие отношения" },
];

export const TACTICS: Record<Tactic, { name: string; icon: string; skill: string }> = {
  listen: { name: "Выслушать", icon: "👂", skill: "empathy" },
  plan: { name: "План и структура", icon: "🗺️", skill: "structure" },
  goal: { name: "Цель и смысл", icon: "🎯", skill: "motivation" },
  challenge: { name: "Прямой разговор", icon: "🪞", skill: "boundaries" },
  space: { name: "Дать пространство", icon: "🌙", skill: "boundaries" },
  family: { name: "Подключить семью", icon: "👪", skill: "family" },
  play: { name: "Игра и награды", icon: "🎮", skill: "motivation" },
};

const PRE = ["Информирую: ", "", "Слушай, ", "Эй, я на твоей стороне 💚 "];
const POST = ["", "", " 🙂", " Я правда рядом, пиши в любое время 🤗"];

export const toneWrap = (tone: Tone, text: string) => {
  const soft = PRE[tone].endsWith(", ") ? text.charAt(0).toLowerCase() + text.slice(1) : text;
  return `${PRE[tone]}${soft}${POST[tone]}`;
};

/** Fills {mock}, {profession} and gender suffixes: {а} / {ся|ась} (male|female). */
export function fmt(text: string, s: Student): string {
  const f = s.gender === "f";
  return text
    .replace(/\{([^{}|]*)\|([^{}]*)\}/g, (_, m, w) => (f ? w : m))
    .replace(/\{([^{}]+)\}/g, (_, t: string) => {
      if (t === "mock") return String(s.mock);
      if (t === "profession") return goalById(s.goalId).profession.toLowerCase();
      if (/^(а|ла|на|ась|ся)$/.test(t)) return f ? t : "";
      return t;
    });
}
