import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Bar, Confetti, Delta, Ladder, Ring, StageTrack, studentColor } from "../components/ui";
import { EGO, EGO_ORDER } from "../data/ego";
import { eventById } from "../data/events";
import { QUESTIONS } from "../data/questions";
import { TYPES } from "../data/mbti";
import { courseById, familyById, goalById } from "../data/world";
import { levelOf, questionsPerWeek } from "../game/career";
import { GRANT_LINE, MAX_SCORE, TOTAL_WEEKS, bestTone, closenessLevel, dominantEgo, finalScoreOf, scoreChoice } from "../game/engine";
import { useGame } from "../game/store";
import { TACTICS, TONES, fmt } from "../game/text";
import type { EgoKey, Letter, Tone } from "../game/types";
import type { Nav } from "../App";

const QUALITY = {
  great: { t: "Отличный ход!", i: "🌟" },
  good: { t: "Хороший ход", i: "👍" },
  meh: { t: "Так себе", i: "😐" },
  bad: { t: "Мимо", i: "😬" },
} as const;

const AXES: ["EI" | "SN" | "TF" | "JP", [Letter, Letter]][] = [["EI", ["E", "I"]], ["SN", ["S", "N"]], ["TF", ["T", "F"]], ["JP", ["J", "P"]]];

export default function CaseView({ sid, go }: { sid: string | null; go: Nav }) {
  const { g, act, advance, ask, intuition, hypothesis } = useGame();
  const student = g.students.find((s) => s.id === sid) ?? g.students[g.students.length - 1];
  const c = student ? g.cases[student.id] : undefined;
  const [tone, setTone] = useState<Tone>(1);
  const [showAsk, setShowAsk] = useState(false);
  const [typing, setTyping] = useState(false);
  const [fire, setFire] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(c?.log.length ?? 0);
  const prevFin = useRef(c?.finished ?? false);

  const logLen = c?.log.length ?? 0;
  const lastFrom = c?.log[logLen - 1]?.from;
  useEffect(() => {
    if (logLen > prevLen.current && lastFrom === "student") {
      setTyping(true);
      const t = setTimeout(() => setTyping(false), 750);
      prevLen.current = logLen;
      return () => clearTimeout(t);
    }
    prevLen.current = logLen;
  }, [logLen, lastFrom]);
  useEffect(() => {
    if (c?.finished && !prevFin.current && (c.finalScore ?? 0) >= GRANT_LINE) setFire((f) => f + 1);
    prevFin.current = c?.finished ?? false;
  }, [c?.finished, c?.finalScore]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [logLen, typing]);

  const level = levelOf(g.curator.xp).level;
  const event = c?.eventId ? eventById(c.eventId) : undefined;
  const best = useMemo(() => {
    if (!student || !c || !event || level < 6) return -1;
    const bt = bestTone(student, c.trust);
    return event.options.reduce((b, o, i) => (scoreChoice(student, c.trust, o, bt).raw > scoreChoice(student, c.trust, event.options[b], bt).raw ? i : b), 0);
  }, [student, c, event, level]);

  if (!student || !c) {
    return (
      <div className="panel empty">
        <div className="big">💬</div>
        <h2>Выберите ученика</h2>
        <p className="muted" style={{ margin: "8px 0 18px" }}>Откройте кейс из списка или создайте нового ученика.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => go("studio")}>Создать ученика</button>
          <button className="btn ghost" onClick={() => go("roster")}>Мои ученики</button>
        </div>
      </div>
    );
  }

  const reveal = !student.blind || c.finished;
  const egoVisible = reveal || level >= 7;
  const color = studentColor(student, reveal);
  const mood = (c.motivation - c.stress + 100) / 200;
  const forecast = finalScoreOf(student, c);
  const dom = dominantEgo(student);
  const visible = typing && lastFrom === "student" ? c.log.slice(0, -1) : c.log;
  const showFeedback = c.acted && c.last && !typing;
  const last = c.last;
  const goal = goalById(student.goalId);
  const course = courseById(student.courseId);
  const fam = familyById(student.familyId);
  const hyp = c.hypothesis;
  const prefTone = bestTone(student, c.trust);
  const knownLetter = (i: number): string => {
    const key = AXES[i][0];
    return reveal || c.revealed.includes(key) ? student.mbti[i] : "?";
  };
  const setH = (key: "EI" | "SN" | "TF" | "JP", l: Letter) => hypothesis(student.id, { ...hyp, letters: { ...hyp.letters, [key]: hyp.letters[key] === l ? undefined : l } });
  const setHEgo = (k: EgoKey | "") => hypothesis(student.id, { ...hyp, ego: k || undefined });
  const notes = QUESTIONS.filter((q) => c.asked.includes(q.id));

  return (
    <div className="case">
      <Confetti fire={fire} />
      <aside className="side">
        <div className="panel student-card" style={{ ["--glow" as string]: `linear-gradient(135deg, ${color}88, transparent)` }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 6 }}>
            <Avatar look={student.look} gender={student.gender} size={132} color={color} mood={mood} stress={c.stress / 100} mark={c.stress > 75 ? "💢" : mood > 0.75 ? "✨" : undefined} />
          </div>
          <h2>{student.name}, {student.age}</h2>
          <p className="muted small">{student.city} · {goal.icon} {goal.profession}</p>
          <div style={{ textAlign: "left", marginTop: 14 }}>
            <Bar label="Доверие" value={c.trust} color="#34d399" />
            <Bar label="Мотивация" value={c.motivation} color="#60a5fa" />
            <Bar label="Стресс" value={c.stress} color="#f87171" invert />
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
            <Ring value={forecast / MAX_SCORE} size={96} stroke={9} color={forecast >= GRANT_LINE ? "#34d399" : "#fbbf24"} big={forecast} small="прогноз ЕНТ" />
            <p className="xs muted" style={{ textAlign: "left", maxWidth: 130 }}>Грант (условно) от {GRANT_LINE}. Старт: {student.mock}, добавлено знаний: {c.knowledge > 0 ? "+" : ""}{c.knowledge}.</p>
          </div>
        </div>

        <div className="panel">
          <div className="step-title">Отношения</div>
          <Ladder trust={c.trust} />
          <div style={{ height: 12 }} />
          <StageTrack week={c.week} />
        </div>

        <div className="panel">
          <div className="step-title">Досье</div>
          <div className="row wrap gap8" style={{ marginBottom: 8 }}>
            {AXES.map(([k], i) => <span key={k} className="badge" style={{ background: knownLetter(i) === "?" ? "rgba(255,255,255,0.08)" : `${color}55`, fontSize: "1rem", padding: "4px 12px" }}>{knownLetter(i)}</span>)}
            {reveal && <span className="pill">{TYPES[student.mbti].nick}</span>}
          </div>
          {egoVisible ? (
            <div style={{ marginBottom: 8 }}>
              {EGO_ORDER.map((k) => <Bar key={k} label={`${EGO[k].emoji} ${EGO[k].name}`} value={student.ego[k]} color={EGO[k].color} />)}
            </div>
          ) : <p className="xs muted" style={{ marginBottom: 8 }}>Эго-состояние неизвестно. Спрашивайте и наблюдайте.</p>}
          <p className="small">💳 {course.name} · {course.price}<br /><span className="muted xs">{course.format}</span></p>
          <p className="small" style={{ marginTop: 6 }}>🎓 Старт на пробнике: {student.mock}</p>
          {(reveal || c.asked.includes("family")) && <p className="small" style={{ marginTop: 6 }}>{fam.icon} {fam.label}</p>}
          {level >= 4 && <p className="small" style={{ marginTop: 6 }}>🧭 Компас тона: ученику сейчас подходит «{TONES[prefTone].name}» {TONES[prefTone].icon}</p>}
          {level >= 3 && !c.revealed.includes("used") && !reveal && <button className="btn sm violet" style={{ marginTop: 8 }} onClick={() => intuition(student.id)}>🔮 Профинтуиция: раскрыть букву</button>}
        </div>

        {notes.length > 0 && (
          <div className="panel">
            <div className="step-title">Заметки куратора</div>
            {notes.map((q) => (
              <details key={q.id}>
                <summary className="small">{q.about}</summary>
                <p className="small muted" style={{ marginTop: 6 }}>«{fmt(q.answer(student), student)}»</p>
              </details>
            ))}
          </div>
        )}

        <div className="panel">
          <div className="step-title">Моя гипотеза</div>
          <div className="row wrap gap8">
            {AXES.map(([k, [a, b]]) => (
              <div key={k} className="seg">
                <button className={hyp.letters[k] === a ? "on" : ""} onClick={() => setH(k, a)}>{a}</button>
                <button className={hyp.letters[k] === b ? "on" : ""} onClick={() => setH(k, b)}>{b}</button>
              </div>
            ))}
          </div>
          <select style={{ marginTop: 10 }} value={hyp.ego ?? ""} onChange={(e) => setHEgo(e.target.value as EgoKey | "")}>
            <option value="">Эго-состояние: пока не знаю</option>
            {EGO_ORDER.map((k) => <option key={k} value={k}>{EGO[k].emoji} {EGO[k].name}</option>)}
          </select>
          <button className="btn sm ghost" style={{ marginTop: 10, width: "100%" }} onClick={() => go("report", student.id)}>📝 Составить отчёт</button>
        </div>
      </aside>

      <main className="stack">
        <section className="panel chat">
          <div className="chat-head">
            <Avatar look={student.look} gender={student.gender} size={40} color={color} mood={mood} stress={c.stress / 100} />
            <div className="grow"><b>{student.name}</b><div className="xs muted">{typing ? "печатает…" : "в сети"}</div></div>
            <span className="pill">нед. {c.week}/{TOTAL_WEEKS}</span>
            <select aria-label="Сменить ученика" style={{ width: "auto" }} value={student.id} onChange={(e) => go("case", e.target.value)}>
              {g.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="chat-log" ref={logRef}>
            {visible.map((m) => <div key={m.id} className={`msg ${m.from}`}>{m.text}</div>)}
            {typing && lastFrom === "student" && <div className="typing"><i /><i /><i /></div>}
          </div>
        </section>

        {c.finished ? (
          <section className="panel center" style={{ padding: 30 }}>
            <div className="row wrap" style={{ justifyContent: "center", gap: 30 }}>
              <Ring value={(c.finalScore ?? 0) / MAX_SCORE} size={170} stroke={14} color={(c.finalScore ?? 0) >= GRANT_LINE ? "#34d399" : "#fbbf24"} big={c.finalScore} small="баллов ЕНТ" />
              <div style={{ textAlign: "left", maxWidth: 420 }}>
                <h2>{(c.finalScore ?? 0) >= GRANT_LINE ? "🎓 Грант совсем рядом!" : "Сезон завершён"}</h2>
                <p className="muted" style={{ margin: "6px 0 12px" }}>
                  {student.name} стартовал{student.gender === "f" ? "а" : ""} с {student.mock} баллов и закончил{student.gender === "f" ? "а" : ""} с {c.finalScore}. Тип: {student.mbti} «{TYPES[student.mbti].nick}», доминирует {EGO[dom].name}. Отношения: {closenessLevel(c.trust) === 3 ? "очень тёплые 💚" : closenessLevel(c.trust) === 2 ? "хорошие 😊" : closenessLevel(c.trust) === 1 ? "нейтральные 🙂" : "отстранённые ❄️"}.
                </p>
                <div className="row wrap">
                  <button className="btn" onClick={() => go("report", student.id)}>📝 Итоговый отчёт</button>
                  <button className="btn ghost" onClick={() => go("studio")}>Новый ученик</button>
                </div>
              </div>
            </div>
          </section>
        ) : showFeedback && last ? (
          <section className={`feedback ${last.quality}`}>
            <div className="row wrap" style={{ justifyContent: "space-between" }}>
              <h3>{QUALITY[last.quality].i} {QUALITY[last.quality].t}</h3>
              <span className="pill">{TACTICS[last.tactic].icon} {TACTICS[last.tactic].name} · {TONES[last.tone].icon} {TONES[last.tone].name}</span>
            </div>
            <div className="row wrap gap8" style={{ margin: "12px 0" }}>
              <Delta label="Доверие" v={last.dTrust} />
              <Delta label="Мотивация" v={last.dMotivation} />
              <Delta label="Стресс" v={last.dStress} goodWhenDown />
              <Delta label="Знания" v={last.dKnowledge} />
            </div>
            {[last.judge.situation, last.judge.style, last.judge.tone].map((ok, i) => (
              <div key={i} className="check"><span>{ok ? "✅" : "❌"}</span><span>{last.why[i]}</span></div>
            ))}
            {reveal ? (
              <div className="quote" style={{ marginTop: 10 }}>
                <b>Разбор ALQA:</b> {last.quality === "bad" || last.quality === "meh" ? `${EGO[dom].avoid[0]}. ` : ""}Как мотивировать «{EGO[dom].name}»: {EGO[dom].motivate[0].toLowerCase()}. Можно сказать: {EGO[dom].say[0]}
              </div>
            ) : <p className="xs muted" style={{ marginTop: 10 }}>🔒 Подробный разбор откроется, когда профиль ученика станет известен.</p>}
            <button className="btn lg" style={{ marginTop: 14 }} onClick={() => advance(student.id)}>{c.week >= TOTAL_WEEKS ? "Сдать ЕНТ 🏁" : "Следующая неделя →"}</button>
          </section>
        ) : (
          <section className="panel stack" style={{ gap: 18 }}>
            <div>
              <div className="step-title">1. Тон общения</div>
              <div className="tones">
                {TONES.map((t) => (
                  <button key={t.id} className={`tone ${tone === t.id ? "on" : ""}`} onClick={() => setTone(t.id)}>
                    <span className="ic">{t.icon}</span><b>{t.name}</b><small>{t.desc}</small>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="step-title">2. {event ? `«${event.title}»: ваш ход` : "Ваш ход"}</div>
              <div className="opts">
                {event?.options.map((o, i) => (
                  <button key={i} className={`opt ${best === i ? "best" : ""}`} disabled={typing} onClick={() => act(student.id, i, tone)}>
                    <span className="tag">{TACTICS[o.tactic].icon} {TACTICS[o.tactic].name}{best === i ? " · ✨ чутьё подсказывает" : ""}</span>
                    <div>{fmt(o.text, student)}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="step-title" style={{ margin: 0 }}>Узнать ученика ({c.questionsLeft} из {questionsPerWeek(level)} вопросов на неделю)</div>
                <button className="btn sm ghost" onClick={() => setShowAsk((v) => !v)}>{showAsk ? "Скрыть" : "Задать вопрос"}</button>
              </div>
              {showAsk && (
                <div className="ask-list" style={{ marginTop: 10 }}>
                  {QUESTIONS.map((q) => (
                    <button key={q.id} className="ask" disabled={c.questionsLeft <= 0 || c.asked.includes(q.id)} onClick={() => ask(student.id, q.id)}>
                      {fmt(q.text, student)}
                      <small>{c.asked.includes(q.id) ? "✔ уже спрашивали" : `${q.about}${q.needs > 0 ? " · 🔒 нужен контакт" : ""}`}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
