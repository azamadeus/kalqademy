import type { Curator, Stats } from "./types";

const KEY = "kalqademy:v1";

export interface Save {
  curator: Curator;
  stats: Record<string, Stats>;
  done: string[];
}

export function loadSave(): Save | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Save) : null;
  } catch {
    return null;
  }
}

export function writeSave(save: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // storage unavailable: progress simply isn't persisted
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
