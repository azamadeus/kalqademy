import { useMemo, useState } from "react";
import { Avatar, Ring, studentColor } from "../components/ui";
import { EGO } from "../data/ego";
import { dominantEgo, woundOf } from "../game/engine";
import type { Student } from "../game/types";
import { buildIpr, gradeIpr, type Grade } from "../quiz/ipr";
import { banName } from "../quiz/ipr";
import { tr } from "../i18n";

export default function Ipr({ student, back, test }: { student: Student; back: () => void; test: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const ipr = useMemo(() => buildIpr(student, attempt), [student, attempt]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const [phrase, setPhrase] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const ego = EGO[dominantEgo(student)];

  const toggle = (key: string, id: string, limit: number) => {
    if (grade) return;
    setPicks((p) => {
      const cur = p[key] ?? [];
      return { ...p, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < limit ? [...cur, id] : cur };
    });
  };
  const done = ipr.questions.every((q) => answers[q.key]) && ipr.sections.every((s) => (picks[s.key] ?? []).length === s.pick);
  const reset = () => { setAttempt((a) => a + 1); setAnswers({}); setPicks({}); setPhrase(""); setGrade(null); window.scrollTo({ top: 0 }); };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card">
        <div className="who">
          <Avatar look={student.look} gender={student.gender} size={64} color={studentColor(student, true)} mood={0.5} stress={0.35} theme={woundOf(student)} outfit={dominantEgo(student)} />
          <div className="grow">
            <h2>{tr("ИПР: {name}", { name: student.name })}</h2>
            <p className="muted small">{student.mbti} · {ego.emoji} {ego.name}</p>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>{tr("Индивидуальный план развития: определите профиль ученика, затем выберите, как с ним общаться. Проверка в конце.")}</p>
      </div>

      {grade && (
        <div className="card center">
          <Ring value={grade.points / Math.max(1, grade.max)} size={130} stroke={11} color={grade.points / Math.max(1, grade.max) >= 0.7 ? "#34d399" : "#fbbf24"} big={`${grade.points}/${grade.max}`} small={tr("баллов")} />
          <h3 style={{ marginTop: 10 }}>{grade.points / Math.max(1, grade.max) >= 0.8 ? tr("Сильный план") : grade.points / Math.max(1, grade.max) >= 0.5 ? tr("Хорошая основа") : tr("Есть что пересмотреть")}</h3>
          <p className="small muted" style={{ marginTop: 8, textAlign: "left" }}><b>{tr("Фраза-образец:")}</b> {grade.model}</p>
          <div className="row wrap" style={{ justifyContent: "center", marginTop: 14 }}>
            <button className="btn" onClick={reset}>{tr("Составить заново")}</button>
            <button className="btn ghost" onClick={test}>{tr("Пройти тест")}</button>
            <button className="btn ghost" onClick={back}>{tr("История ученика")}</button>
          </div>
        </div>
      )}

      <div className="card stack" style={{ gap: 16 }}>
        <div className="step-title"><span className="num">1</span>{tr("Профиль")}</div>
        {ipr.questions.map((qn) => {
          const g = grade?.profile.find((x) => x.q.key === qn.key);
          return (
            <div key={qn.key}>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>{qn.title}</div>
              <div className="stack" style={{ gap: 6 }}>
                {qn.options.map((o) => {
                  const state = grade ? (o.id === qn.right ? "ok" : answers[qn.key] === o.id ? "no" : "") : answers[qn.key] === o.id ? "sel" : "";
                  return (
                    <button key={o.id} className={`opt ${state}`} disabled={!!grade && state === ""} onClick={() => !grade && setAnswers({ ...answers, [qn.key]: o.id })}>
                      <b className="small">{o.text}</b>
                      {o.sub && <div className="xs muted">{o.sub}</div>}
                    </button>
                  );
                })}
              </div>
              {g && !g.ok && <p className="xs muted" style={{ marginTop: 4 }}>{tr("Верно: {v}", { v: qn.options.find((o) => o.id === qn.right)?.text ?? "" })}</p>}
            </div>
          );
        })}
      </div>

      {ipr.sections.map((s, n) => {
        const g = grade?.sections.find((x) => x.s.key === s.key);
        return (
          <div key={s.key} className="card stack" style={{ gap: 10 }}>
            <div className="step-title"><span className="num">{n + 2}</span>{s.title}</div>
            <p className="xs muted">{s.hint}</p>
            <div className="stack" style={{ gap: 6 }}>
              {s.items.map((it) => {
                const chosen = (picks[s.key] ?? []).includes(it.id);
                const state = grade ? (chosen ? (it.ok ? "ok" : "no") : it.ok ? "ok" : "") : chosen ? "sel" : "";
                return (
                  <button key={it.id} className={`opt ${state}`} onClick={() => toggle(s.key, it.id, s.pick)} disabled={!!grade && !chosen && !it.ok}>
                    <div className="small">{it.text}</div>
                    {it.sub && <div className="xs muted" style={{ marginTop: 3 }}>{it.sub}</div>}
                  </button>
                );
              })}
            </div>
            {g && g.lines.map((l, i) => <div key={i} className="quote">{l}</div>)}
          </div>
        );
      })}

      <div className="card stack" style={{ gap: 8 }}>
        <div className="step-title"><span className="num">{ipr.sections.length + 2}</span>{tr("Ваша первая фраза ученику")}</div>
        <textarea rows={3} value={phrase} placeholder={tr("Например: «Я знаю, что ты боишься ошибаться. Давай сегодня…»")} onChange={(e) => setPhrase(e.target.value)} />
        <p className="xs muted">{tr("Эта фраза не оценивается: сравните её с образцом после проверки.")}</p>
      </div>

      {!grade && (
        <div className="row wrap" style={{ justifyContent: "center" }}>
          <button className="btn lg" disabled={!done} onClick={() => { setGrade(gradeIpr(student, ipr, answers, picks)); window.scrollTo({ top: 0 }); }}>{tr("Проверить ИПР")}</button>
          <button className="link" onClick={back}>{tr("Назад")}</button>
        </div>
      )}
      {!grade && !done && <p className="xs muted center">{tr("Заполните профиль и выберите варианты во всех разделах.")}</p>}
      {grade && <p className="xs muted center">{tr("Главный запрет ученика: {v}", { v: banName(String(ipr.profile.bans[0])) })}</p>}
    </div>
  );
}
