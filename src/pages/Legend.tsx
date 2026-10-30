import { Avatar, studentColor } from "../components/ui";
import { EGO } from "../data/ego";
import { TYPES } from "../data/mbti";
import { dominantEgo, woundOf } from "../game/engine";
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
          <Avatar look={student.look} gender={student.gender} size={130} color={studentColor(student, true)} mood={0.5} stress={0.35} theme={woundOf(student)} />
        </div>
        <h2 style={{ marginTop: 10 }}>{lg.title}</h2>
        <div className="row wrap gap8" style={{ justifyContent: "center", marginTop: 8 }}>
          <span className="pill">{student.mbti} · {TYPES[student.mbti].nick}</span>
          <span className="pill">{ego.emoji} {ego.name}</span>
        </div>
      </div>
      <p className="xs muted center" style={{ margin: "-6px auto 0", maxWidth: 480 }}>{tr("Выражение лица аватара отражает его чувствительную тему. Это игровая стилизация, а не способ «определять» травму по телу или внешности реальных людей.")}</p>
      <div className="card">
        <div className="step-title">📊 {tr("Эгограмма")}</div>
        {lg.egogram.map((r) => (
          <div key={r.key} className="egorow">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <b className="small">{r.emoji} {r.name}</b>
              <span className="xs muted">{r.level === "high" ? tr("Высокий") : r.level === "low" ? tr("Низкий") : tr("Средний")} · {r.value}</span>
            </div>
            <div className="thin" style={{ margin: "6px 0" }}><i style={{ width: `${r.value}%`, background: r.color }} /></div>
            {r.text && <p className="xs muted">{r.text}</p>}
          </div>
        ))}
      </div>
      {lg.sections.map((sec) => sec.fold ? (
        <details key={sec.head} className="card fold">
          <summary>{sec.icon} {sec.head}</summary>
          {sec.lines.map((l, i) => <p key={i} className="small muted" style={{ marginTop: 8 }}>{l}</p>)}
        </details>
      ) : (
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
