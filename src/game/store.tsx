import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as A from "./actions";
import { ACHIEVEMENTS, levelOf } from "./career";
import type { GameState, Hypothesis, Plan, ReportInput, Student, Tone } from "./types";

const KEY = "kalqademy:v2";

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const g = JSON.parse(raw) as GameState;
      if (g.version === A.VERSION) return g;
    }
  } catch {
    // storage unavailable or corrupted: start fresh
  }
  return A.newGame();
}

export interface Toast {
  id: number;
  kind: "achievement" | "level";
  title: string;
  text: string;
  icon: string;
}

interface Api {
  g: GameState;
  toasts: Toast[];
  dismiss: (id: number) => void;
  addStudent: (s: Student) => void;
  removeStudent: (id: string) => void;
  ask: (sid: string, qid: string) => void;
  act: (sid: string, option: number, tone: Tone) => void;
  advance: (sid: string) => void;
  intuition: (sid: string) => void;
  hypothesis: (sid: string, h: Hypothesis) => void;
  report: (sid: string, r: ReportInput) => void;
  plan: (sid: string, p: Plan) => void;
  setName: (name: string) => void;
  reset: () => void;
}

const Ctx = createContext<Api | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [g, setG] = useState<GameState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevLevel = useRef(levelOf(g.curator.xp).level);
  const toastId = useRef(1);

  const update = useCallback((fn: (g: GameState) => GameState) => {
    setG((cur) => {
      const next = fn(cur);
      return next === cur ? cur : next;
    });
  }, []);

  // Achievements and level-ups are derived after every state change.
  useEffect(() => {
    const { g: g2, fresh } = A.checkAchievements(g);
    const lv = levelOf(g.curator.xp).level;
    const add: Toast[] = [];
    if (lv > prevLevel.current) {
      add.push({ id: toastId.current++, kind: "level", icon: "⭐", title: `Уровень ${lv}!`, text: "Вы выросли как куратор. Загляните в «Путь куратора»: открылись новые возможности." });
    }
    prevLevel.current = lv;
    if (fresh.length) {
      add.push(
        ...fresh.map((id) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id)!;
          return { id: toastId.current++, kind: "achievement" as const, icon: a.icon, title: a.name, text: a.desc };
        }),
      );
      setToasts((t) => [...t, ...add]);
      setG(g2);
      return;
    }
    if (add.length) setToasts((t) => [...t, ...add]);
    try {
      localStorage.setItem(KEY, JSON.stringify(g));
    } catch {
      // progress is simply not persisted
    }
  }, [g]);

  const api = useMemo<Api>(
    () => ({
      g,
      toasts,
      dismiss: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
      addStudent: (s) => update((x) => A.addStudent(x, s)),
      removeStudent: (id) => update((x) => A.removeStudent(x, id)),
      ask: (sid, qid) => update((x) => A.ask(x, sid, qid)),
      act: (sid, o, t) => update((x) => A.act(x, sid, o, t)),
      advance: (sid) => update((x) => A.advance(x, sid)),
      intuition: (sid) => update((x) => A.useIntuition(x, sid)),
      hypothesis: (sid, h) => update((x) => A.setHypothesis(x, sid, h)),
      report: (sid, r) => update((x) => A.submitReport(x, sid, r)),
      plan: (sid, p) => update((x) => A.submitPlan(x, sid, p)),
      setName: (name) => update((x) => ({ ...x, curator: { ...x.curator, name } })),
      reset: () => {
        setToasts([]);
        prevLevel.current = 1;
        setG(A.newGame());
      },
    }),
    [g, toasts, update],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGame(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGame outside GameProvider");
  return v;
}
