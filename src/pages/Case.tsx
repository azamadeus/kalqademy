import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Bar, Confetti, Delta, Ladder, Ring, StageTrack, studentColor } from "../components/ui";
import { seasonReview } from "../game/review";
import { EGO, EGO_ORDER } from "../data/ego";
import { eventById } from "../data/events";
import { QUESTIONS } from "../data/questions";
import { TYPES } from "../data/mbti";
import { courseById, familyById, goalById } from "../data/world";
import { levelOf } from "../game/career";
import { GRANT_LINE, MAX_SCORE, TOTAL_WEEKS, bestTone, closenessLevel, dominantEgo, finalScoreOf, scoreChoice, woundOf } from "../game/engine";
import { WOUNDS } from "../data/wounds";
import { useGame } from "../game/store";
import { TACTICS, TONES, fmt } from "../game/text";
import type { EgoKey, Letter, Tone } from "../game/types";
import type { Nav } from "../App";
import { tr } from "../i18n";

const QUALITY = {
  great: { t: tr("Отличный ход!"), i: "🌟" },
  good: { t: tr("Хороший ход"), i: "👍" },
  meh: { t: tr("Так себе"), i: "😐" },
  bad: { t: tr("Мимо"), i: "😬" },
} as const;

const AXES: ["EI" | "SN" | "TF" | "JP", [Letter, Letter]][] = [["EI", ["E", "I"]], ["SN", ["S", "N"]], ["TF", ["T", "F"]], ["JP", ["J", "P"]]];

export default function CaseView({ sid, go }: { sid: string | null; go: Nav }) {
  const { g, act, advance, ask, intuition, hypothesis } = useGame();
  const student = g.students.find((s) => s.id === sid) ?? g.students[g.students.length - 1];
  const c = student ? g.cases[student.id] : undefined;
  const [tone, setTone] = useState<Tone>(1);
  const [pick, setPick] = useState<number | null>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pick != null) revealRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [pick]);
  const [showAsk, setShowAsk] = useState(false);
  const [typing, setTyping] = useState(false);
  const [fire, setFire] = useState(0);
  const [react, setReact] = useState("");
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

  const lastQ = c?.last?.quality;
  const lastEv = c?.last?.eventId;
  useEffect(() => {
    if (!lastQ) return;
    setReact(lastQ);
    const t = setTimeout(() => setReact(""), 900);
    return () => clearTimeout(t);
  }, [lastQ, lastEv, c?.week]);

  const level = levelOf(g.curator.xp).level;
  const event = c?.eventId ? eventById(c.eventId) : undefined;
  const best = useMemo(() => {
    if (!student || !c || !event || level < 6) return -1;
    const bt = bestTone(student, c.trust);
    return event.options.reduce((b, o, i) => (scoreChoice(student, c.trust, o, bt).raw > scoreChoice(student, c.trust, event.options[b], bt).raw ? i : b), 0);
  }, [student, c, event, level]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (!student || !c || c.finished || c.acted || typing) return;
      const idx = "1234".indexOf(e.key);
      if (idx >= 0 && event?.options[idx]) setPick(idx);
      const ti = "qwer".indexOf(e.key.toLowerCase());
      if (ti >= 0) setTone(ti as Tone);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [student, c, event, typing, tone, act]);

  if (!student || !c) {
    return (
      <div className="panel empty">
        <div className="big">💬</div>
        <h2>{tr("Выберите ученика")}</h2>
        <p className="muted" style={{ margin: "8px 0 18px" }}>{tr("Откройте кейс из списка или создайте нового ученика.")}</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => go("studio")}>{tr("Создать ученика")}</button>
          <button className="btn ghost" onClick={() => go("roster")}>{tr("Мои ученики")}</button>
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

  const pickedOpt = pick != null ? event?.options[pick] : undefined;
  const send = () => { if (pick != null) { act(student.id, pick, tone); setPick(null); } };
  const profile = (
    <details className="profile">
      <summary>{tr("Профиль ученика")}</summary>
      <div className="stack" style={{ gap: 18, marginTop: 12 }}>
        <div>
          <div className="step-title">{tr("Отношения")}</div>
          <Ladder trust={c.trust} />
          <div style={{ height: 12 }} />
          <StageTrack week={c.week} />
        </div>
        <div>
          <div className="step-title">{tr("Досье")}</div>
          <div className="row wrap gap8" style={{ marginBottom: 8 }}>
            {AXES.map(([k], i) => <span key={k} className="badge" style={{ background: knownLetter(i) === "?" ? "rgba(255,255,255,0.08)" : `${color}55`, fontSize: "1rem", padding: "4px 12px" }}>{knownLetter(i)}</span>)}
            {reveal && <span className="pill">{TYPES[student.mbti].nick}</span>}
          </div>
          {egoVisible ? (
            <div style={{ marginBottom: 8 }}>
              {EGO_ORDER.map((k) => <Bar key={k} label={`${EGO[k].emoji} ${EGO[k].name}`} value={student.ego[k]} color={EGO[k].color} />)}
            </div>
          ) : <p className="xs muted" style={{ marginBottom: 8 }}>{tr("Эго-состояние неизвестно. Спрашивайте и наблюдайте.")}</p>}
          <p className="small">💳 {course.name} · {course.price}<br /><span className="muted xs">{course.format}</span></p>
          <p className="small" style={{ marginTop: 6 }}>{tr("🎓 Старт на пробнике: {mock}", { mock: student.mock })}</p>
          {(reveal || c.asked.includes("family")) && <p className="small" style={{ marginTop: 6 }}>{fam.icon} {fam.label}</p>}
          {reveal && <p className="small" style={{ marginTop: 6 }}>{WOUNDS[woundOf(student)].emoji} {tr("Чувствительная тема: {name}", { name: WOUNDS[woundOf(student)].name })}</p>}
          {level >= 4 && <p className="small" style={{ marginTop: 6 }}>{tr("🧭 Компас тона: ученику сейчас подходит «{name}» {icon}", { name: TONES[prefTone].name, icon: TONES[prefTone].icon })}</p>}
          {level >= 3 && !c.revealed.includes("used") && !reveal && <button className="btn sm ghost" style={{ marginTop: 8 }} onClick={() => intuition(student.id)}>{tr("🔮 Профинтуиция: раскрыть букву")}</button>}
        </div>
        {notes.length > 0 && (
          <div>
            <div className="step-title">{tr("Заметки куратора")}</div>
            {notes.map((q) => (
              <details key={q.id}>
                <summary className="small">{q.about}</summary>
                <p className="small muted" style={{ marginTop: 6 }}>«{fmt(q.answer(student), student)}»</p>
              </details>
            ))}
          </div>
        )}
        <div>
          <div className="step-title">{tr("Моя гипотеза")}</div>
          <div className="row wrap gap8">
            {AXES.map(([k, [a, b]]) => (
              <div key={k} className="seg">
                <button className={hyp.letters[k] === a ? "on" : ""} onClick={() => setH(k, a)}>{a}</button>
                <button className={hyp.letters[k] === b ? "on" : ""} onClick={() => setH(k, b)}>{b}</button>
              </div>
            ))}
          </div>
          <select style={{ marginTop: 10 }} value={hyp.ego ?? ""} onChange={(e) => setHEgo(e.target.value as EgoKey | "")}>
            <option value="">{tr("Эго-состояние: пока не знаю")}</option>
            {EGO_ORDER.map((k) => <option key={k} value={k}>{EGO[k].emoji} {EGO[k].name}</option>)}
          </select>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn sm ghost grow" onClick={() => go("plan", student.id)}>{tr("🧭 План")}{c.planResult ? ` · ${c.planResult.score}` : ""}</button>
            <button className="btn sm ghost grow" onClick={() => go("report", student.id)}>{tr("📝 Отчёт")}</button>
          </div>
        </div>
      </div>
    </details>
  );

  return (
    <div className="flow">
      <Confetti fire={fire} />
      <header className="who">
        <div className={`react ${react}`}><Avatar look={student.look} gender={student.gender} size={64} color={color} mood={mood} stress={c.stress / 100} mark={c.stress > 75 ? "💢" : mood > 0.75 ? "✨" : undefined} /></div>
        <div className="grow">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h2>{student.name}, {student.age}</h2>
            <span className="muted small">{tr("нед.")} {Math.min(c.week, TOTAL_WEEKS)}/{TOTAL_WEEKS}</span>
          </div>
          <p className="muted small">{goal.icon} {goal.profession}</p>
          <div className="thin"><i style={{ width: `${(Math.min(c.week, TOTAL_WEEKS) / TOTAL_WEEKS) * 100}%` }} /></div>
        </div>
      </header>

      <div className="meters">
        <div><span className="xs muted">{tr("Доверие")}</span><b>{c.trust}</b></div>
        <div><span className="xs muted">{tr("Мотивация")}</span><b>{c.motivation}</b></div>
        <div><span className="xs muted">{tr("Стресс")}</span><b>{c.stress}</b></div>
        <div><span className="xs muted">{tr("прогноз ЕНТ")}</span><b>{forecast}</b></div>
      </div>

      <section className="chat">
        <div className="chat-log" ref={logRef}>
          {visible.slice(-6).map((m) => <div key={m.id} className={`msg ${m.from}`}>{m.text}</div>)}
          {typing && lastFrom === "student" && <div className="typing"><i /><i /><i /></div>}
        </div>
      </section>

      {c.finished ? (
        <section className="card center">
          <Ring value={(c.finalScore ?? 0) / MAX_SCORE} size={150} stroke={12} color={(c.finalScore ?? 0) >= GRANT_LINE ? "#34d399" : "#fbbf24"} big={c.finalScore} small={tr("баллов ЕНТ")} />
          <h2 style={{ marginTop: 14 }}>{(c.finalScore ?? 0) >= GRANT_LINE ? tr("🎓 Грант совсем рядом!") : tr("Сезон завершён")}</h2>
          <p className="muted" style={{ margin: "6px auto 16px", maxWidth: 460 }}>
            {fmt(tr("{name} стартовал{а} с {mock} баллов и закончил{а} с {score}. Тип: {mbti} «{nick}», доминирует {ego}. Отношения: {rel}.", { name: student.name, mock: student.mock, score: c.finalScore ?? 0, mbti: student.mbti, nick: TYPES[student.mbti].nick, ego: EGO[dom].name, rel: closenessLevel(c.trust) === 3 ? tr("очень тёплые 💚") : closenessLevel(c.trust) === 2 ? tr("хорошие 😊") : closenessLevel(c.trust) === 1 ? tr("нейтральные 🙂") : tr("отстранённые ❄️") }), student)}
          </p>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            <button className="btn" onClick={() => go("report", student.id)}>{tr("📝 Итоговый отчёт")}</button>
            <button className="btn ghost" onClick={() => go("studio")}>{tr("Новый ученик")}</button>
          </div>
          {(() => {
            const r = seasonReview(c);
            return (
              <details style={{ textAlign: "left", marginTop: 22 }}>
                <summary>{tr("Разбор сезона · {n} ходов", { n: r.total })}</summary>
                <div className="review" style={{ marginTop: 10 }}>
                  <div className="cell"><b style={{ color: "#34d399" }}>{r.counts.great}</b><span className="xs muted">{tr("отлично")}</span></div>
                  <div className="cell"><b style={{ color: "#60a5fa" }}>{r.counts.good}</b><span className="xs muted">{tr("хорошо")}</span></div>
                  <div className="cell"><b style={{ color: "#fbbf24" }}>{r.counts.meh}</b><span className="xs muted">{tr("так себе")}</span></div>
                  <div className="cell"><b style={{ color: "#f87171" }}>{r.counts.bad}</b><span className="xs muted">{tr("мимо")}</span></div>
                </div>
                <p className="xs muted">{tr("Точный тон: {rate}% ходов · план сработал: {planned}", { rate: Math.round(r.toneRate * 100), planned: r.planned })}</p>
                <h4 style={{ marginTop: 10 }}>{tr("Что получилось")}</h4>{r.strengths.map((t) => <div key={t} className="quote">✅ {t}</div>)}
                <h4 style={{ marginTop: 10 }}>{tr("Что улучшить")}</h4>{r.improve.length ? r.improve.map((t) => <div key={t} className="quote" style={{ borderColor: "#fbbf24" }}>⚠️ {t}</div>) : <div className="quote">{tr("Явных слабых мест не видно. Попробуйте более сложного ученика.")}</div>}
              </details>
            );
          })()}
        </section>
      ) : showFeedback && last ? (
        <section className={`card feedback ${last.quality}`}>
          <h3>{QUALITY[last.quality].i} {QUALITY[last.quality].t}</h3>
          <p className="muted small" style={{ marginTop: 2 }}>{TACTICS[last.tactic].icon} {TACTICS[last.tactic].name} · {TONES[last.tone].icon} {TONES[last.tone].name}</p>
          <div className="row wrap gap8" style={{ margin: "12px 0" }}>
            <Delta label={tr("Доверие")} v={last.dTrust} />
            <Delta label={tr("Мотивация")} v={last.dMotivation} />
            <Delta label={tr("Стресс")} v={last.dStress} goodWhenDown />
            <Delta label={tr("Знания")} v={last.dKnowledge} />
          </div>
          {[last.judge.situation, last.judge.style, last.judge.tone].map((ok, i) => (
            <div key={i} className="check"><span>{ok ? "✅" : "❌"}</span><span>{last.why[i]}</span></div>
          ))}
          {eventById(last.eventId)?.serious && <div className="quote" style={{ borderColor: "#f87171" }}>{tr("⚠️ В реальной ситуации с такими словами: выслушать, не обещать тайну и сразу привлечь школьного психолога и ответственных взрослых.")}</div>}
          {last.planned && <div className="check"><span>📋</span><span>{last.why[3]}</span></div>}
          {reveal ? (
            <details style={{ marginTop: 10 }}>
              <summary>{tr("Разбор ALQA:")}</summary>
              <p className="small" style={{ marginTop: 8 }}>{last.quality === "bad" || last.quality === "meh" ? `${EGO[dom].avoid[0]}. ` : ""}{tr("Как мотивировать «{ego}»: {how}. Можно сказать: {say}", { ego: EGO[dom].name, how: EGO[dom].motivate[0].toLowerCase(), say: EGO[dom].say[0] })}</p>
            </details>
          ) : <p className="xs muted" style={{ marginTop: 10 }}>{tr("🔒 Подробный разбор откроется, когда профиль ученика станет известен.")}</p>}
          <button className="btn lg block" style={{ marginTop: 16 }} onClick={() => advance(student.id)}>{c.week >= TOTAL_WEEKS ? tr("Сдать ЕНТ 🏁") : tr("Следующая неделя →")}</button>
        </section>
      ) : (
        <section className="card stack" style={{ gap: 20 }}>
          <div>
            <div className="step-title"><span className="num">1</span>{event ? tr("«{title}»: ваш ход", { title: event.title }) : tr("Ваш ход")}</div>
            <div className="opts">
              {event?.options.map((o, i) => (
                <button key={i} className={`opt ${pick === i ? "sel" : ""}`} disabled={typing} onClick={() => setPick(i)}>
                  <span className="tag">{TACTICS[o.tactic].icon} {TACTICS[o.tactic].name}{best === i ? " ✨" : ""}</span>
                  <div>{fmt(o.text, student)}</div>
                </button>
              ))}
            </div>
          </div>
          {pickedOpt && (
            <div className="reveal" ref={revealRef}>
              <div className="step-title"><span className="num">2</span>{tr("Тон общения")}</div>
              <div className="tones">
                {TONES.map((t) => (
                  <button key={t.id} className={`tone ${tone === t.id ? "on" : ""}`} onClick={() => setTone(t.id)} title={t.desc}>
                    <span className="ic">{t.icon}</span><b>{t.name}</b>
                  </button>
                ))}
              </div>
              <p className="xs muted" style={{ margin: "8px 0 14px", minHeight: 16 }}>{TONES[tone].desc}</p>
              <button className="btn lg block" onClick={send}>{tr("Отправить")}</button>
            </div>
          )}
          <div className="ask-wrap">
            <button className="link" onClick={() => setShowAsk((v) => !v)}>{showAsk ? tr("Скрыть") : tr("Задать вопрос")} · {tr("осталось {n}", { n: c.questionsLeft })}</button>
            {showAsk && (
              <div className="ask-list" style={{ marginTop: 10 }}>
                {QUESTIONS.map((q) => (
                  <button key={q.id} className="ask" disabled={c.questionsLeft <= 0 || c.asked.includes(q.id)} onClick={() => ask(student.id, q.id)}>
                    {fmt(q.text, student)}
                    <small>{c.asked.includes(q.id) ? tr("✔ уже спрашивали") : tr("{about}{needs}", { about: q.about, needs: q.needs > 0 ? tr(" · 🔒 нужен контакт") : "" })}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {profile}
    </div>
  );
}
