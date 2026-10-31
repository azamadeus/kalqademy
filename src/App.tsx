import { useState } from "react";
import Build from "./pages/Build";
import Home from "./pages/Home";
import Ipr from "./pages/Ipr";
import LiveHost from "./pages/LiveHost";
import LivePlay from "./pages/LivePlay";
import Legend from "./pages/Legend";
import Quiz from "./pages/Quiz";
import { createStudent } from "./game/generate";
import type { Student } from "./game/types";
import { LANG, setLang, tr } from "./i18n";

export type View = "home" | "build" | "legend" | "quiz" | "ipr" | "host" | "play";

export default function App() {
  const joinCode = (() => { const m = location.hash.match(/^#join-([A-Za-z0-9]{3,8})$/); return m ? m[1].toUpperCase() : ""; })();
  const [view, setView] = useState<View>(joinCode ? "play" : "home");
  const [student, setStudent] = useState<Student | null>(null);
  const show = (s: Student) => { setStudent(s); setView("legend"); window.scrollTo({ top: 0 }); };
  const random = () => show(createStudent({ seed: Math.floor(Math.random() * 900000) + 100, blind: false }));

  return (
    <div className="app">
      <header className="nav">
        <button className="brand" onClick={() => setView("home")}>Kalqademy</button>
        <button className="navlink" aria-label={tr("Язык")} title={tr("Язык")} onClick={() => setLang(LANG === "kk" ? "ru" : "kk")}>{LANG === "kk" ? "РУС" : "ҚАЗ"}</button>
      </header>
      {view === "home" && <Home random={random} build={() => setView("build")} live={() => setView("host")} />}
      {view === "host" && <LiveHost back={() => setView("home")} />}
      {view === "play" && <LivePlay code={joinCode} back={() => { history.replaceState(null, "", location.pathname + location.search); setView("home"); }} />}
      {view === "build" && <Build done={show} back={() => setView("home")} />}
      {view === "legend" && student && <Legend student={student} start={() => setView("quiz")} ipr={() => setView("ipr")} back={() => setView("home")} />}
      {view === "ipr" && student && <Ipr student={student} back={() => setView("legend")} test={() => setView("quiz")} />}
      {view === "quiz" && student && <Quiz student={student} again={() => setView("legend")} fresh={() => setView("home")} />}
    </div>
  );
}
