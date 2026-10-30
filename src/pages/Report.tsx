import { useEffect, useState } from "react";
import { Avatar, Ring, studentColor } from "../components/ui";
import { EGO, EGO_ORDER } from "../data/ego";
import { TYPES } from "../data/mbti";
import { WOUND_ORDER, WOUNDS } from "../data/wounds";
import { useGame } from "../game/store";
import { TACTICS, TONES } from "../game/text";
import type { EgoKey, Letter, ReportInput, ReportResult, Tactic, Tone } from "../game/types";
import type { Nav } from "../App";
import { tr } from "../i18n";

const AXES: ["EI" | "SN" | "TF" | "JP", [Letter, Letter]][] = [["EI", ["E", "I"]], ["SN", ["S", "N"]], ["TF", ["T", "F"]], ["JP", ["J", "P"]]];

export default function Report({ sid, go }: { sid: string | null; go: Nav }) {
  const { g, report } = useGame();
  const student = g.students.find((s) => s.id === sid) ?? g.students[g.students.length - 1];
  const c = student ? g.cases[student.id] : undefined;
  const [input, setInput] = useState<ReportInput>({ letters: {}, ego: null, tone: null, tactics: [], note: "" });
  const [shown, setShown] = useState<ReportResult | null>(null);

  useEffect(() => {
    if (c) setInput((i) => ({ ...i, letters: { ...c.hypothesis.letters }, ego: c.hypothesis.ego ?? null }));
    setShown(null);
  }, [student?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!student || !c) {
    return (
      <div className="panel empty">
        <div className="big">📝</div>
        <h2>{tr("Нет ученика для отчёта")}</h2>
        <p className="muted" style={{ margin: "8px 0 18px" }}>{tr("Сначала создайте ученика и проведите хотя бы пару недель.")}</p>
        <button className="btn" onClick={() => go("studio")}>{tr("Создать ученика")}</button>
      </div>
    );
  }

  const reveal = !student.blind || c.finished;
  const color = studentColor(student, reveal);
  const ready = Object.keys(input.letters).filter((k) => input.letters[k as "EI"]).length === 4 && input.ego && input.tone != null && input.tactics.length === 2;
  const toggleTactic = (t: Tactic) =>
    setInput((i) => ({ ...i, tactics: i.tactics.includes(t) ? i.tactics.filter((x) => x !== t) : i.tactics.length < 2 ? [...i.tactics, t] : i.tactics }));
  const submit = () => {
    report(student.id, input);
    setShown(null);
  };
  const latest = c.reports[c.reports.length - 1];
  const result = shown ?? latest ?? null;

  return (
    <div className="stack">
      <div className="row wrap" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>{tr("Отчёт по ученику")}</h2>
          <p className="muted small">{tr("Определите тип, эго-состояние, лучший тон и тактики. Система сравнит с реальностью и ответит от лица ученика.")}</p>
        </div>
        <select aria-label={tr("Ученик")} style={{ width: "auto" }} value={student.id} onChange={(e) => go("report", e.target.value)}>
          {g.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <div className="panel stack" style={{ gap: 16 }}>
          <div className="row">
            <Avatar look={student.look} gender={student.gender} size={64} color={color} mood={(c.motivation - c.stress + 100) / 200} stress={c.stress / 100} />
            <div><h3>{student.name}, {student.age}</h3><p className="muted small">{tr("Неделя {week} из 12 · отчётов: {n}", { week: c.week, n: c.reports.length })}</p></div>
          </div>
          <div>
            <div className="lbl">{tr("Тип MBTI")}</div>
            <div className="row wrap" style={{ marginTop: 6 }}>
              {AXES.map(([k, [a, b]]) => (
                <div key={k} className="seg">
                  <button className={input.letters[k] === a ? "on" : ""} onClick={() => setInput({ ...input, letters: { ...input.letters, [k]: a } })}>{a}</button>
                  <button className={input.letters[k] === b ? "on" : ""} onClick={() => setInput({ ...input, letters: { ...input.letters, [k]: b } })}>{b}</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="lbl">{tr("Доминирующее эго-состояние")}</div>
            <div className="grid2" style={{ gap: 8, marginTop: 6 }}>
              {EGO_ORDER.map((k: EgoKey) => (
                <button key={k} className={`choice ${input.ego === k ? "on" : ""}`} onClick={() => setInput({ ...input, ego: k })}>{EGO[k].emoji} {EGO[k].name}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="lbl">{tr("Чувствительная тема (гипотеза, по поведению и словам)")}</div>
            <div className="row wrap gap8" style={{ marginTop: 6 }}>
              {WOUND_ORDER.map((w) => (
                <button key={w} className={`choice ${input.wound === w ? "on" : ""}`} style={{ padding: "8px 12px" }} onClick={() => setInput({ ...input, wound: input.wound === w ? null : w })} title={WOUNDS[w].theme}>{WOUNDS[w].emoji} {WOUNDS[w].name}</button>
              ))}
            </div>
            <p className="xs muted" style={{ marginTop: 6 }}>{tr("Это рабочая гипотеза о том, что задевает ученика, а не диагноз. Определяйте только по поведению и словам, не по внешности.")}</p>
          </div>
          <div>
            <div className="lbl">{tr("Подходящий тон общения")}</div>
            <div className="tones" style={{ marginTop: 6 }}>
              {TONES.map((t) => (
                <button key={t.id} className={`tone ${input.tone === t.id ? "on" : ""}`} onClick={() => setInput({ ...input, tone: t.id as Tone })}><span className="ic">{t.icon}</span><b>{t.name}</b></button>
              ))}
            </div>
          </div>
          <div>
            <div className="lbl">{tr("Две лучшие тактики для этого ученика ({n}/2)", { n: input.tactics.length })}</div>
            <div className="row wrap gap8" style={{ marginTop: 6 }}>
              {(Object.keys(TACTICS) as Tactic[]).map((t) => (
                <button key={t} className={`choice ${input.tactics.includes(t) ? "on" : ""}`} style={{ padding: "8px 12px" }} onClick={() => toggleTactic(t)}>{TACTICS[t].icon} {TACTICS[t].name}</button>
              ))}
            </div>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{tr("Рекомендации (по желанию)")}</label>
            <textarea rows={3} value={input.note} placeholder={tr("Что вы будете делать дальше с этим учеником?")} onChange={(e) => setInput({ ...input, note: e.target.value })} />
          </div>
          <button className="btn lg" disabled={!ready} onClick={submit}>{tr("Отправить отчёт")}</button>
          {!ready && <p className="xs muted">{tr("Заполните все четыре буквы, эго-состояние, тон и две тактики.")}</p>}
        </div>

        <div className="stack">
          {result ? (
            <div className="panel stack" style={{ gap: 14 }}>
              <div className="row wrap" style={{ gap: 20 }}>
                <Ring value={result.score / 100} size={120} color={result.score >= 70 ? "#34d399" : result.score >= 40 ? "#fbbf24" : "#f87171"} big={result.score} small={tr("из 100")} />
                <div><h3>{tr("Оценка отчёта")}</h3><p className="muted small">{tr("Буквы: {letters}/4 · эго: {ego} · тема: {theme} · тон: {tone}% · тактики: {tactics}/2", { letters: result.lettersCorrect, ego: result.egoCorrect ? tr("верно") : tr("неверно"), theme: result.woundCorrect ? tr("верно") : tr("нет"), tone: result.toneScore, tactics: result.tacticsHit })}<br />{tr("Опыт: +{xp} · неделя {week}", { xp: result.xp, week: result.week })}</p></div>
              </div>
              <div>
                <div className="lbl">{tr("Обратная связь от ученика")}</div>
                <div className="row" style={{ alignItems: "flex-start", marginTop: 8 }}>
                  <Avatar look={student.look} gender={student.gender} size={48} color={color} mood={0.7} stress={0.2} />
                  <div className="msg student" style={{ maxWidth: "none" }}>{result.studentMessage}</div>
                </div>
              </div>
              <div>
                <div className="lbl">{tr("Разбор методики ALQA")}</div>
                {result.expert.map((t, i) => <div key={i} className="quote">{t}</div>)}
              </div>
              {reveal && <p className="xs muted">{tr("Профиль: {mbti} «{nick}»", { mbti: student.mbti, nick: TYPES[student.mbti].nick })}</p>}
            </div>
          ) : (
            <div className="panel empty"><div className="big">📋</div><h3>{tr("Здесь появится оценка")}</h3><p className="muted small" style={{ marginTop: 6 }}>{tr("Отправьте отчёт, и ученик ответит вам, а система разберёт ошибки.")}</p></div>
          )}
          {c.reports.length > 1 && (
            <div className="panel">
              <div className="lbl">{tr("История отчётов")}</div>
              {c.reports.map((r, i) => (
                <button key={r.at} className="ask" style={{ width: "100%", marginTop: 6 }} onClick={() => setShown(r)}>
                  {tr("Отчёт")} {i + 1} {tr("· неделя")} {r.week} · {r.score}/100
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
