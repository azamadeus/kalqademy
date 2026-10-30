import type { Student, Tactic, Tone } from "./types";
import { goalById } from "../data/world";
import { tr } from "../i18n";

export const TONES: { id: Tone; name: string; icon: string; desc: string }[] = [
  { id: 0, name: tr("Отстранённо"), icon: "❄️", desc: tr("Деловой тон, дистанция, только факты") },
  { id: 1, name: tr("Нейтрально"), icon: "🙂", desc: tr("Спокойно и вежливо, без лишних эмоций") },
  { id: 2, name: tr("Хорошо"), icon: "😊", desc: tr("Дружелюбно, заметно участие и поддержка") },
  { id: 3, name: tr("Очень тепло"), icon: "🤗", desc: tr("Близко и искренне, как с родным человеком") },
];

export const CLOSENESS = [
  { name: tr("Отстранённые"), icon: "❄️", from: 0, hint: tr("Вы пока чужие люди") },
  { name: tr("Нейтральные"), icon: "🙂", from: 25, hint: tr("Рабочий контакт, есть уважение") },
  { name: tr("Хорошие"), icon: "😊", from: 50, hint: tr("Доверие и открытость") },
  { name: tr("Очень тёплые"), icon: "💚", from: 75, hint: tr("Истинно близкие отношения") },
];

export const TACTICS: Record<Tactic, { name: string; icon: string; skill: string }> = {
  listen: { name: tr("Выслушать"), icon: "👂", skill: "empathy" },
  plan: { name: tr("План и структура"), icon: "🗺️", skill: "structure" },
  goal: { name: tr("Цель и смысл"), icon: "🎯", skill: "motivation" },
  challenge: { name: tr("Прямой разговор"), icon: "🪞", skill: "boundaries" },
  space: { name: tr("Дать пространство"), icon: "🌙", skill: "boundaries" },
  family: { name: tr("Подключить семью"), icon: "👪", skill: "family" },
  play: { name: tr("Игра и награды"), icon: "🎮", skill: "motivation" },
};

const PRE = [tr("Информирую: "), "", tr("Слушай, "), tr("Эй, я на твоей стороне 💚 ")];
const POST = ["", "", " 🙂", tr(" Я правда рядом, пиши в любое время 🤗")];

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
