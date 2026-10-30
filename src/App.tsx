import { useEffect, useState } from "react";
import { Onboarding } from "./components/ui";
import Career from "./pages/Career";
import CaseView from "./pages/Case";
import Home from "./pages/Home";
import PlanPage from "./pages/Plan";
import Knowledge from "./pages/Knowledge";
import Report from "./pages/Report";
import Roster from "./pages/Roster";
import Studio from "./pages/Studio";
import { createStudent } from "./game/generate";
import { GameProvider, useGame } from "./game/store";
import { LANG, setLang, tr } from "./i18n";

export type View = "home" | "roster" | "studio" | "case" | "plan" | "report" | "career" | "knowledge";
export type Nav = (v: View, sid?: string) => void;

const LINKS: { id: View; label: string }[] = [
  { id: "roster", label: tr("Ученики") },
  { id: "career", label: tr("Путь куратора") },
  { id: "knowledge", label: tr("База знаний") },
];

function Shell() {
  const { toasts, dismiss, addStudent } = useGame();
  const [view, setView] = useState<View>("home");
  const [sid, setSid] = useState<string | null>(null);
  const [help, setHelp] = useState(() => {
    try { return !localStorage.getItem("kalqademy:seen"); } catch { return false; }
  });
  const closeHelp = () => {
    setHelp(false);
    try { localStorage.setItem("kalqademy:seen", "1"); } catch { /* ignore */ }
  };
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

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => dismiss(toasts[0].id), 4500);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);

  return (
    <>
      <div className="app">
        <header className="nav">
          <button className="brand" onClick={() => go("home")}>Kalqademy</button>
          <nav className="links" aria-label={tr("Разделы")}>
            {LINKS.map((t) => (
              <button key={t.id} className={`navlink ${view === t.id ? "on" : ""}`} onClick={() => go(t.id)}>{t.label}</button>
            ))}
          </nav>
          <button className="navlink" aria-label={tr("Язык")} title={tr("Язык")} onClick={() => setLang(LANG === "kk" ? "ru" : "kk")}>{LANG === "kk" ? "РУС" : "ҚАЗ"}</button>
          <button className="navlink" aria-label={tr("Как играть")} title={tr("Как играть")} onClick={() => setHelp(true)}>?</button>
        </header>

        {view === "home" && <Home go={go} demo={demo} />}
        {view === "roster" && <Roster go={go} />}
        {view === "studio" && <Studio go={go} />}
        {view === "case" && <CaseView sid={sid} go={go} />}
        {view === "plan" && <PlanPage sid={sid} go={go} />}
        {view === "report" && <Report sid={sid} go={go} />}
        {view === "career" && <Career />}
        {view === "knowledge" && <Knowledge />}
      </div>

      {help && <Onboarding onClose={closeHelp} />}

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
