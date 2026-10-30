import { Avatar, studentColor } from "../components/ui";
import { EGO } from "../data/ego";
import { TYPES } from "../data/mbti";
import { dominantEgo } from "../game/engine";
import type { Student } from "../game/types";
import { legendOf } from "../quiz/legend";
import { tr } from "../i18n";

export default function Legend({ student, start, back }: { student: Student; start: () => void; back: () => void }) {
  const lg = legendOf(student);
  const ego = EGO[dominantEgo(student)];
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card center">
        <div style={{ display: "grid", placeItems: "center" }}>
          <Avatar look={student.look} gender={student.gender} size={130} color={studentColor(student, true)} mood={0.7} stress={0.25} />
        </div>
        <h2 style={{ marginTop: 10 }}>{lg.title}</h2>
        <div className="row wrap gap8" style={{ justifyContent: "center", marginTop: 8 }}>
          <span className="pill">{student.mbti} · {TYPES[student.mbti].nick}</span>
          <span className="pill">{ego.emoji} {ego.name}</span>
        </div>
      </div>
      {lg.sections.map((sec) => (
        <div key={sec.head} className="card">
          <div className="step-title">{sec.icon} {sec.head}</div>
          {sec.lines.map((l, i) => <p key={i} className={i ? "small muted" : ""} style={{ marginTop: i ? 6 : 0 }}>{l}</p>)}
        </div>
      ))}
      <div className="row wrap" style={{ justifyContent: "center" }}>
        <button className="btn lg" onClick={start}>{tr("Начать тест")}</button>
        <button className="link" onClick={back}>{tr("Назад")}</button>
      </div>
    </div>
  );
}
