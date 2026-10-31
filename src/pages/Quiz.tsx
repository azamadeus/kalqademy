import { useMemo, useState } from "react";
import { Avatar, Confetti, Ring, studentColor } from "../components/ui";
import { phrasesOf, woundPhrasesOf } from "../data/phrases";
import { driverSays } from "../quiz/legend";
import { dominantEgo, woundOf } from "../game/engine";
import { TACTICS, fmt } from "../game/text";
import type { Student } from "../game/types";
import { QUIZ_LENGTH, analysisOf, buildQuiz, hintFor, isTheme, isVoice, questionText } from "../quiz/quiz";
import { tr } from "../i18n";

export default function Quiz({ student, again, fresh }: { student: Student; again: () => void; fresh: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const quiz = useMemo(() => buildQuiz(student, attempt), [student, attempt]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const color = studentColor(student, true);
  const icon = (q: (typeof quiz)[number], o: number) => (isVoice(q) || isTheme(q) ? "" : `${TACTICS[q.event.options[o].tactic].icon} `);
  const phrases = phrasesOf(student.mbti);
  const wPhrases = woundPhrasesOf(woundOf(student));
  const dPhrases = driverSays(student.mbti);
  /** The student's message, followed by a phrase typical for their type (not in a safety-critical situation). */
  const speech = (q: (typeof quiz)[number], n: number) =>
    q.event.serious || isVoice(q) || isTheme(q) || !phrases.length ? questionText(q, student) : `${questionText(q, student)} ${fmt(n % 3 === 1 && wPhrases.length ? wPhrases[(n + student.seed) % wPhrases.length] : n % 3 === 2 && dPhrases.length ? dPhrases[(n + student.seed) % dPhrases.length] : phrases[(n + student.seed) % phrases.length], student)}.`;

  const retry = () => { setAttempt((a) => a + 1); setI(0); setAnswers([]); setChosen(null); };

  if (i >= quiz.length) {
    const hits = answers.filter((a, k) => quiz[k].right.includes(a)).length;
    const misses = quiz.map((q, k) => ({ q, k, a: answers[k] })).filter((x) => !x.q.right.includes(x.a));
    return (
      <div className="stack" style={{ gap: 18 }}>
        <Confetti fire={hits >= Math.ceil(quiz.length * 0.8) ? 1 : 0} />
        <div className="card center">
          <Ring value={hits / quiz.length} size={150} stroke={12} color={hits / quiz.length >= 0.7 ? "#34d399" : "#fbbf24"} big={`${hits}/${quiz.length}`} small={tr("баллов")} />
          <h2 style={{ marginTop: 14 }}>{hits === quiz.length ? tr("Идеально!") : hits / quiz.length >= 0.7 ? tr("Отличный результат") : tr("Есть что подтянуть")}</h2>
          <p className="muted small" style={{ marginTop: 4 }}>{misses.length ? tr("Ниже подсказки по ответам, где промахнулись.") : tr("Ни одной ошибки.")}</p>
          <div className="row wrap" style={{ justifyContent: "center", marginTop: 16 }}>
            <button className="btn" onClick={retry}>{tr("Пройти ещё раз")}</button>
            <button className="btn ghost" onClick={again}>{tr("История ученика")}</button>
            <button className="btn ghost" onClick={fresh}>{tr("Новый ученик")}</button>
          </div>
        </div>
        <details className="card fold">
          <summary>🔎 {tr("Разбор ученика")}</summary>
          {analysisOf(student).map((l, n) => <p key={n} className="small" style={{ marginTop: 8 }}>{l}</p>)}
        </details>
        {misses.map(({ q, k, a }) => (
          <div key={k} className="card hint">
            <div className="step-title">{k + 1}. {q.event.title}</div>
            <div className="msg student" style={{ maxWidth: "100%" }}>{questionText(q, student)}</div>
            <p className="small" style={{ margin: "12px 0 4px" }}>❌ {tr("Вы ответили:")} <span className="muted">{icon(q, a)}{fmt(q.event.options[a].text, student)}</span></p>
            <p className="small">✅ {tr("Лучше:")} {icon(q, q.right[0])}{fmt(q.event.options[q.right[0]].text, student)}</p>
            {hintFor(student, q, a, k).map((l, n) => <div key={n} className="quote">{l}</div>)}
          </div>
        ))}
      </div>
    );
  }

  const q = quiz[i];
  const answered = chosen != null;
  const pick = (o: number) => { if (!answered) setChosen(o); };
  const next = () => { setAnswers([...answers, chosen as number]); setChosen(null); setI(i + 1); };

  return (
    <div className="flow">
      <header className="who">
        <Avatar look={student.look} gender={student.gender} size={56} color={color} mood={0.6} stress={0.3} theme={woundOf(student)} outfit={dominantEgo(student)} />
        <div className="grow">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <b>{student.name} · {student.mbti}</b>
            <span className="muted small">{i + 1}/{Math.min(QUIZ_LENGTH, quiz.length)}</span>
          </div>
          <div className="thin"><i style={{ width: `${((i + (answered ? 1 : 0)) / quiz.length) * 100}%` }} /></div>
        </div>
      </header>
      <section className="chat"><div className="chat-log" style={isTheme(q) ? { maxHeight: "none" } : undefined}><div className="msg system">{q.event.title}</div>{isTheme(q) && <div style={{ display: "grid", placeItems: "center", padding: "6px 0" }}><Avatar look={student.look} gender={student.gender} size={180} color={color} mood={0.5} stress={0.35} theme={woundOf(student)} outfit={dominantEgo(student)} /></div>}<div className="msg student" style={isTheme(q) ? { maxWidth: "100%" } : undefined}>{speech(q, i)}</div></div></section>
      <section className="card stack" style={{ gap: 12 }}>
        <div className="step-title">{tr("Ваш ответ")}</div>
        <div className="opts">
          {q.event.options.map((o, n) => {
            const state = !answered ? "" : n === chosen ? (q.right.includes(n) ? "ok" : "no") : "";
            return (
              <button key={n} className={`opt ${state}`} disabled={answered && n !== chosen} onClick={() => pick(n)}>
                {!isVoice(q) && !isTheme(q) && <span className="tag">{TACTICS[o.tactic].icon} {TACTICS[o.tactic].name}</span>}
                <div>{fmt(o.text, student)}</div>
              </button>
            );
          })}
        </div>
        {answered && (
          <div className="reveal">
            <p className="small" style={{ margin: "4px 0 12px" }}>{q.right.includes(chosen as number) ? tr("✅ В точку! +1 балл") : tr("❌ Не то. Подсказка будет в конце.")}</p>
            <button className="btn lg block" onClick={next}>{i + 1 >= quiz.length ? tr("Результат") : tr("Дальше")}</button>
          </div>
        )}
      </section>
    </div>
  );
}
