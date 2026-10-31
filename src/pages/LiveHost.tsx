import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Avatar, studentColor } from "../components/ui";
import { EGO } from "../data/ego";
import { TYPES } from "../data/mbti";
import { dominantEgo, woundOf } from "../game/engine";
import { createStudent } from "../game/generate";
import { fmt } from "../game/text";
import { tr } from "../i18n";
import { MAX_PLAYERS, newCode, pointsFor, rankPlayers, scoreMsg, trimName, type HintMsg, type Phase, type QuestionMsg, type Scores, type StateMsg } from "../live/game";
import { qrSvg } from "../live/qr";
import { connect, type LivePeer, type Transport } from "../live/transport";
import { COLORS, SHAPES, defaultJoinBase } from "../live/ui";
import { buildQuiz, hintFor, questionText, type Question } from "../quiz/quiz";

interface Game {
  phase: Phase;
  i: number;
  startAt: number;
  limit: number;
  answers: Map<string, { a: number; at: number }>;
  scores: Scores;
  counts: number[];
  hint: string[];
  right: number[];
  ranked: ReturnType<typeof rankPlayers>;
}

const fresh = (): Game => ({ phase: "lobby", i: 0, startAt: 0, limit: 25000, answers: new Map(), scores: { total: {}, gained: {}, names: {} }, counts: [0, 0, 0, 0], hint: [], right: [], ranked: [] });

export default function LiveHost({ back }: { back: () => void }) {
  const [code, setCode] = useState(newCode);
  const [student, setStudent] = useState(() => createStudent({ seed: Math.floor(Math.random() * 900000) + 100, blind: false }));
  const quiz = useMemo<Question[]>(() => buildQuiz(student, 0), [student]);
  const [seconds, setSeconds] = useState(25);
  const [base, setBase] = useState(defaultJoinBase);
  const [net, setNet] = useState<Transport | null>(null);
  const [err, setErr] = useState("");
  const [peers, setPeers] = useState<LivePeer[]>([]);
  const g = useRef<Game>(fresh());
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const players = useMemo(
    () => peers.filter((p) => !p.isMe && p.presence.kind === "player" && typeof p.presence.name === "string" && p.presence.name).slice(0, MAX_PLAYERS),
    [peers],
  );
  const playersRef = useRef(players);
  playersRef.current = players;

  useEffect(() => {
    let off = () => {};
    let closed = false;
    let t: Transport | null = null;
    void connect(code, "host").then((r) => {
      if (closed) { if (r.ok) r.t.close(); return; }
      if (!r.ok) { setErr(r.reason); return; }
      t = r.t;
      setNet(r.t);
      off = r.t.onPeers((p) => setPeers(p.slice()));
    });
    return () => { closed = true; off(); t?.close(); };
  }, [code]);

  const q = quiz[g.current.i];
  const broadcast = () => {
    if (!net) return;
    const s = g.current;
    const st: StateMsg = {
      phase: s.phase, code, i: s.i, total: quiz.length,
      endsIn: s.phase === "question" ? Math.max(0, s.startAt + s.limit - Date.now()) : 0,
      players: playersRef.current.length,
      answered: playersRef.current.filter((p) => s.answers.has(p.id)).length,
      right: s.phase === "lobby" || s.phase === "question" ? [] : s.right,
    };
    void net.emit("st", st).catch(() => {});
    if (s.phase !== "lobby" && quiz[s.i]) {
      const qq = quiz[s.i];
      const m: QuestionMsg = { i: s.i, title: qq.event.title, text: questionText(qq, student), options: qq.event.options.map((o) => fmt(o.text, student)) };
      void net.emit("q", m).catch(() => {});
    }
    if (s.phase === "reveal" || s.phase === "board" || s.phase === "end") {
      const h: HintMsg = { i: s.i, hint: s.hint.map((x) => x.slice(0, 200)), counts: s.counts };
      void net.emit("h", h).catch(() => {});
      void net.emit("sc", scoreMsg(s.i, s.ranked)).catch(() => {});
    }
  };
  const broadcastRef = useRef(broadcast);
  broadcastRef.current = broadcast;

  // record answers as players change their presence
  useEffect(() => {
    const s = g.current;
    for (const p of players) {
      s.scores.names[p.id] = trimName(p.presence.name);
      if (s.phase === "question" && p.presence.q === s.i && typeof p.presence.a === "number" && p.presence.a >= 0 && p.presence.a < 4 && !s.answers.has(p.id)) {
        s.answers.set(p.id, { a: p.presence.a, at: Date.now() });
      }
    }
    if (s.phase === "question" && players.length > 0 && players.every((p) => s.answers.has(p.id))) finish();
    else broadcastRef.current();
    bump();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  // timer and keep-alive
  useEffect(() => {
    const a = setInterval(() => {
      const s = g.current;
      if (s.phase === "question" && Date.now() >= s.startAt + s.limit) finish();
      bump();
    }, 250);
    const b = setInterval(() => broadcastRef.current(), 1500);
    return () => { clearInterval(a); clearInterval(b); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net]);

  function startQuestion(i: number) {
    const s = g.current;
    s.phase = "question"; s.i = i; s.startAt = Date.now(); s.limit = seconds * 1000; s.answers = new Map(); s.counts = [0, 0, 0, 0]; s.hint = []; s.right = quiz[i].right;
    s.scores.gained = {};
    broadcast(); bump();
  }
  function finish() {
    const s = g.current;
    if (s.phase !== "question") return;
    const qq = quiz[s.i];
    const wrongCount: Record<number, number> = {};
    for (const p of playersRef.current) {
      const ans = s.answers.get(p.id);
      const ok = !!ans && qq.right.includes(ans.a);
      const gain = pointsFor(ok, ans ? ans.at - s.startAt : s.limit, s.limit);
      s.scores.gained[p.id] = gain;
      s.scores.total[p.id] = (s.scores.total[p.id] ?? 0) + gain;
      if (ans) { s.counts[ans.a]++; if (!ok) wrongCount[ans.a] = (wrongCount[ans.a] ?? 0) + 1; }
    }
    const wrong = Object.entries(wrongCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const wi = wrong !== undefined ? Number(wrong) : qq.event.options.findIndex((_, k) => !qq.right.includes(k));
    s.hint = wi >= 0 ? hintFor(student, qq, wi, s.i) : [];
    s.ranked = rankPlayers(s.scores, playersRef.current.map((p) => p.id));
    s.phase = "reveal";
    broadcast(); bump();
  }
  const go = (phase: Phase) => { g.current.phase = phase; broadcast(); bump(); };
  const next = () => (g.current.i + 1 >= quiz.length ? go("end") : startQuestion(g.current.i + 1));
  const reset = () => { g.current = fresh(); setCode(newCode()); setStudent(createStudent({ seed: Math.floor(Math.random() * 900000) + 100, blind: false })); setNet(null); setPeers([]); bump(); };

  const s = g.current;
  const joinUrl = `${base.replace(/#.*$/, "")}#join-${code}`;
  const left = s.phase === "question" ? Math.max(0, Math.ceil((s.startAt + s.limit - Date.now()) / 1000)) : 0;
  const answered = players.filter((p) => s.answers.has(p.id)).length;

  if (err) {
    return (
      <div className="card center stack">
        <h2>{tr("Живая игра недоступна")}</h2>
        <p className="muted small">{err === "not_host" ? tr("Вести игру может только владелец страницы: другие участники могут играть.") : tr("Не удалось подключиться к комнате. Откройте страницу из claude.ai под своим аккаунтом или подключите свой сервер.")}</p>
        <button className="btn" onClick={back}>{tr("Назад")}</button>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      {s.phase === "lobby" && (
        <>
          <div className="card center stack" style={{ gap: 12 }}>
            <h2>{tr("Живая игра")}</h2>
            <p className="muted small">{tr("Игроки сканируют QR-код, вводят имя и отвечают на телефонах, как в Kahoot.")}</p>
            <div style={{ display: "grid", placeItems: "center" }} dangerouslySetInnerHTML={{ __html: qrSvg(joinUrl, 220) }} aria-label="QR" />
            <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: 8 }}>{code}</div>
            <details style={{ textAlign: "left" }}>
              <summary className="small">{tr("Адрес для входа")}</summary>
              <input type="text" value={base} onChange={(e) => setBase(e.target.value)} aria-label={tr("Адрес для входа")} style={{ marginTop: 8 }} />
              <p className="xs muted" style={{ marginTop: 6 }}>{joinUrl}</p>
            </details>
            <p className="xs muted">{net ? "✅ " + tr("Комната открыта") : tr("Подключаемся…")}</p>
          </div>

          <div className="card stack" style={{ gap: 10 }}>
            <div className="who">
              <Avatar look={student.look} gender={student.gender} size={64} color={studentColor(student, true)} mood={0.5} stress={0.35} theme={woundOf(student)} outfit={dominantEgo(student)} />
              <div className="grow">
                <b>{student.name}, {student.age}</b>
                <p className="muted small">{student.mbti} · {TYPES[student.mbti].nick} · {EGO[dominantEgo(student)].name}</p>
              </div>
              <button className="btn sm ghost" onClick={() => setStudent(createStudent({ seed: Math.floor(Math.random() * 900000) + 100, blind: false }))}>{tr("Другой ученик")}</button>
            </div>
            <div className="row wrap">
              <label className="small muted">{tr("Время на ответ")}</label>
              <div className="seg">
                {[15, 25, 40].map((v) => <button key={v} className={seconds === v ? "on" : ""} onClick={() => setSeconds(v)}>{v}</button>)}
              </div>
            </div>
          </div>

          <div className="card stack" style={{ gap: 8 }}>
            <div className="step-title">{tr("Игроки")}: {players.length}</div>
            <div className="row wrap gap8">
              {players.length === 0 && <span className="muted small">{tr("Пока никого. Покажите QR-код.")}</span>}
              {players.map((p) => <span key={p.id} className="pill">{trimName(p.presence.name)}</span>)}
            </div>
            <button className="btn lg block" disabled={players.length === 0 || !net} onClick={() => startQuestion(0)}>{tr("Начать игру")}</button>
          </div>
        </>
      )}

      {s.phase === "question" && q && (
        <>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="pill">{s.i + 1}/{quiz.length}</span>
            <span style={{ fontSize: "2rem", fontWeight: 900 }}>{left}</span>
            <span className="pill">{answered}/{players.length} {tr("ответили")}</span>
          </div>
          <div className="card"><div className="step-title">{q.event.title}</div><div className="msg student" style={{ maxWidth: "100%", fontSize: "1.15rem" }}>{questionText(q, student)}</div></div>
          <div className="live-opts">
            {q.event.options.map((o, k) => <div key={k} className="lopt" style={{ background: COLORS[k] }}><b>{SHAPES[k]}</b><span>{fmt(o.text, student)}</span></div>)}
          </div>
        </>
      )}

      {s.phase === "reveal" && q && (
        <>
          <div className="card"><div className="step-title">{q.event.title}</div><div className="msg student" style={{ maxWidth: "100%" }}>{questionText(q, student)}</div></div>
          <div className="live-opts">
            {q.event.options.map((o, k) => (
              <div key={k} className={`lopt ${s.right.includes(k) ? "right" : "dim"}`} style={{ background: COLORS[k] }}>
                <b>{SHAPES[k]}</b><span>{fmt(o.text, student)}</span><i>{s.counts[k]}</i>
              </div>
            ))}
          </div>
          {s.hint.map((h, n) => <div key={n} className="quote">{h}</div>)}
          <button className="btn lg block" onClick={() => go("board")}>{tr("Таблица лидеров")}</button>
        </>
      )}

      {(s.phase === "board" || s.phase === "end") && (
        <div className="card stack" style={{ gap: 10 }}>
          <h2 className="center">{s.phase === "end" ? tr("Итоги") : tr("Таблица лидеров")}</h2>
          {s.ranked.slice(0, s.phase === "end" ? 10 : 5).map((r) => (
            <div key={r.id} className="lrow"><b>{r.rank}</b><span className="grow">{r.name}</span><span>{r.score}</span>{s.phase === "board" && r.gained > 0 && <span className="pill">+{r.gained}</span>}</div>
          ))}
          {s.phase === "board" && <button className="btn lg block" onClick={next}>{s.i + 1 >= quiz.length ? tr("Финал") : tr("Дальше")}</button>}
          {s.phase === "end" && <div className="row wrap" style={{ justifyContent: "center" }}><button className="btn" onClick={reset}>{tr("Новая игра")}</button><button className="btn ghost" onClick={back}>{tr("Выйти")}</button></div>}
        </div>
      )}
    </div>
  );
}
