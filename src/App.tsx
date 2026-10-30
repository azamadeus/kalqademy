import { useState } from "react";
import Build from "./pages/Build";
import Home from "./pages/Home";
import Legend from "./pages/Legend";
import Quiz from "./pages/Quiz";
import { createStudent } from "./game/generate";
import type { Student } from "./game/types";
import { LANG, setLang, tr } from "./i18n";

export type View = "home" | "build" | "legend" | "quiz";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [student, setStudent] = useState<Student | null>(null);
  const show = (s: Student) => { setStudent(s); setView("legend"); window.scrollTo({ top: 0 }); };
  const random = () => show(createStudent({ seed: Math.floor(Math.random() * 900000) + 100, blind: false }));

  return (
    <div className="app">
      <header className="nav">
        <button className="brand" onClick={() => setView("home")}>Kalqademy</button>
        <button className="navlink" aria-label={tr("Язык")} title={tr("Язык")} onClick={() => setLang(LANG === "kk" ? "ru" : "kk")}>{LANG === "kk" ? "РУС" : "ҚАЗ"}</button>
      </header>
      {view === "home" && <Home random={random} build={() => setView("build")} />}
      {view === "build" && <Build done={show} back={() => setView("home")} />}
      {view === "legend" && student && <Legend student={student} start={() => setView("quiz")} back={() => setView("home")} />}
      {view === "quiz" && student && <Quiz student={student} again={() => setView("legend")} fresh={() => setView("home")} />}
    </div>
  );
}
