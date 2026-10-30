import { useEffect, useState } from "react";
import { Ring } from "./components/ui";
import Career from "./pages/Career";
import CaseView from "./pages/Case";
import Home from "./pages/Home";
import Knowledge from "./pages/Knowledge";
import Report from "./pages/Report";
import Roster from "./pages/Roster";
import Studio from "./pages/Studio";
import { levelOf, rankOf } from "./game/career";
import { createStudent } from "./game/generate";
import { GameProvider, useGame } from "./game/store";

export type View = "home" | "roster" | "studio" | "case" | "report" | "career" | "knowledge";
export type Nav = (v: View, sid?: string) => void;

const TABS: { id: View; label: string }[] = [
  { id: "home", label: "Главная" },
  { id: "roster", label: "Ученики" },
  { id: "studio", label: "Студия" },
  { id: "case", label: "Диалог" },
  { id: "report", label: "Отчёт" },
  { id: "career", label: "Путь куратора" },
  { id: "knowledge", label: "База знаний" },
];

function Shell() {
  const { g, toasts, dismiss, addStudent } = useGame();
  const [view, setView] = useState<View>("home");
  const [sid, setSid] = useState<string | null>(null);
  const go: Nav = (v, id) => {
    setView(v);
    if (id !== undefined) setSid(id);
    window.scrollTo({ top: 0 });
  };
  const demo = () => {
    const s = createStudent({ seed: Math.floor(Math.random() * 900000) + 100, blind: true });
    addStudent(s);
    go("case", s.id);
  };
  const { level, into, need } = levelOf(g.curator.xp);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => dismiss(toasts[0].id), 4500);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);

  return (
    <>
      <div className="bg" aria-hidden><div className="orb o1" /><div className="orb o2" /><div className="orb o3" /></div>
      <div className="app">
        <header className="nav">
          <button className="brand" onClick={() => go("home")}><span className="logo">🎓</span>Kalqademy</button>
          <nav className="tabs" aria-label="Разделы">
            {TABS.map((t) => (
              <button key={t.id} className={`tab ${view === t.id ? "on" : ""}`} onClick={() => go(t.id)}>{t.label}</button>
            ))}
          </nav>
          <div className="chip-user" onClick={() => go("career")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go("career")}>
            <Ring value={into / need} size={38} stroke={4} color="#fbbf24" big={<span style={{ fontSize: "0.9rem" }}>{level}</span>} small="" />
            <div><strong>{g.curator.name}</strong><small>{rankOf(level).name}</small></div>
          </div>
        </header>

        {view === "home" && <Home go={go} demo={demo} />}
        {view === "roster" && <Roster go={go} />}
        {view === "studio" && <Studio go={go} />}
        {view === "case" && <CaseView sid={sid} go={go} />}
        {view === "report" && <Report sid={sid} go={go} />}
        {view === "career" && <Career />}
        {view === "knowledge" && <Knowledge />}
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.slice(-3).map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)} role="status">
            <span className="ic">{t.icon}</span><div><b>{t.title}</b><div className="small muted">{t.text}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
