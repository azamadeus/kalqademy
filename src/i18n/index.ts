import { KK } from "./kk";

export type Lang = "ru" | "kk";

const KEY = "kalqademy:lang";

function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "kk" || v === "ru") return v;
  } catch {
    // storage unavailable: default language
  }
  return "ru";
}

/** The language is fixed for the life of the page; switching reloads it, so module-level constants stay consistent. */
export const LANG: Lang = readLang();

/** Translate a Russian source string. Placeholders look like {name} and are filled from params. */
export function tr(ru: string, params?: Record<string, string | number>): string {
  const s = LANG === "kk" ? (KK[ru] ?? ru) : ru;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    // ignore
  }
  location.reload();
}

if (typeof document !== "undefined") document.documentElement.lang = LANG;
