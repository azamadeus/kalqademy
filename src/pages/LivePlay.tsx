import { useEffect, useRef, useState } from "react";
import { tr } from "../i18n";
import { short, trimName, type HintMsg, type QuestionMsg, type ScoreMsg, type StateMsg } from "../live/game";
import { connect, type Transport } from "../live/transport";
import { COLORS, SHAPES } from "../live/ui";

type Status = "name" | "connecting" | "in" | "error";

export default function LivePlay({ code, back }: { code: string; back: () => void }) {
  const [name, setName] = useState(() => { try { return localStorage.getItem("kalqademy:name") ?? ""; } catch { return ""; } });
  const [status, setStatus] = useState<Status>("name");
  const [reason, setReason] = useState("");
  const [st, setSt] = useState<StateMsg | null>(null);
  const [q, setQ] = useState<QuestionMsg | null>(null);
  const [h, setH] = useState<HintMsg | null>(null);
  const [sc, setSc] = useState<ScoreMsg | null>(null);
  const [mine, setMine] = useState<number | null>(null);
  const [leftMs, setLeftMs] = useState(0);
  const net = useRef<Transport | null>(null);
  const deadline = useRef(0);

  useEffect(() => () => net.current?.close(), []);
  useEffect(() => {
    const t = setInterval(() => setLeftMs(Math.max(0, deadline.current - Date.now())), 250);
    return () => clearInterval(t);
  }, []);

  async function join() {
    const n = trimName(name);
    if (!n) return;
    try { localStorage.setItem("kalqademy:name", n); } catch { /* ignore */ }
    setStatus("connecting");
    const r = await connect(code, "player");
    if (!r.ok) { setReason(r.reason); setStatus("error"); return; }
    const t = r.t;
    net.current = t;
    t.on("st", (d) => { const m = d as StateMsg; setSt(m); deadline.current = Date.now() + m.endsIn; });
    t.on("q", (d) => setQ(d as QuestionMsg));
    t.on("h", (d) => setH(d as HintMsg));
    t.on("sc", (d) => setSc(d as ScoreMsg));
    t.presence({ kind: "player", name: n, q: -1, a: -1 });
    setStatus("in");
  }

  const answer = (k: number) => {
    if (!st || mine !== null) return;
    setMine(k);
    net.current?.presence({ q: st.i, a: k });
  };
  // a new question resets the local answer
  const qi = st?.phase === "question" ? st.i : -1;
  const lastQ = useRef(-1);
  useEffect(() => {
    if (qi !== lastQ.current) { lastQ.current = qi; if (qi >= 0) setMine(null); }
  }, [qi]);

  const myId = short(net.current?.peers().find((p) => p.isMe)?.id ?? "");
  const me = sc && sc.i === st?.i ? sc.s.find((x) => x[0] === myId) : undefined;

  if (status === "name" || status === "connecting") {
    return (
      <div className="card center stack" style={{ gap: 14 }}>
        <h2>{tr("Вход в игру")} {code}</h2>
        <input type="text" value={name} maxLength={16} placeholder={tr("Ваше имя")} aria-label={tr("Ваше имя")} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void join()} />
        <button className="btn lg block" disabled={!trimName(name) || status === "connecting"} onClick={() => void join()}>{status === "connecting" ? tr("Подключаемся…") : tr("Войти")}</button>
        <button className="link" onClick={back}>{tr("Назад")}</button>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="card center stack">
        <h2>{tr("Не удалось войти")}</h2>
        <p className="muted small">{reason === "no_room" ? tr("Игры с таким кодом нет. Проверьте код.") : reason === "full" ? tr("В комнате нет мест.") : tr("Нет подключения. Откройте страницу под своим аккаунтом claude.ai или попросите ведущего прислать новую ссылку.")}</p>
        <button className="btn" onClick={() => setStatus("name")}>{tr("Ещё раз")}</button>
      </div>
    );
  }

  if (!st || st.phase === "lobby") return <div className="card center stack"><h2>{tr("Вы в игре")}</h2><p className="muted">{trimName(name)}</p><p className="muted small">{tr("Ждём начала, смотрите на экран ведущего.")}</p></div>;

  if (st.phase === "question" && q && q.i === st.i) {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}><span className="pill">{st.i + 1}/{st.total}</span><b style={{ fontSize: "1.6rem" }}>{Math.ceil(leftMs / 1000)}</b></div>
        <div className="msg student" style={{ maxWidth: "100%" }}>{q.text}</div>
        {mine !== null ? (
          <div className="card center"><h3>✅ {tr("Ответ принят")}</h3><p className="muted small">{tr("Ждём остальных…")}</p></div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {q.options.map((o, k) => <button key={k} className="lopt play" style={{ background: COLORS[k] }} onClick={() => answer(k)}><b>{SHAPES[k]}</b><span>{o}</span></button>)}
          </div>
        )}
      </div>
    );
  }

  if (st.phase === "reveal" || st.phase === "board") {
    const ok = mine !== null && st.right.includes(mine);
    return (
      <div className="stack" style={{ gap: 12 }}>
        <div className="card center">
          <h2>{mine === null ? tr("Вы не успели") : ok ? "✅ " + tr("Верно!") : "❌ " + tr("Не то")}</h2>
          {me && <p style={{ marginTop: 6 }}><b>+{me[2]}</b> · {tr("Очки")}: {me[1]} · #{me[3]}</p>}
        </div>
        {q && q.i === st.i && st.right.length > 0 && <div className="card small"><b>{tr("Лучше:")}</b> {st.right.map((r) => q.options[r]).join(" / ")}</div>}
        {h && h.i === st.i && h.hint.map((x, n) => <div key={n} className="quote small">{x}</div>)}
      </div>
    );
  }

  return (
    <div className="card center stack">
      <h2>{tr("Игра окончена")}</h2>
      {me ? <p><b>#{me[3]}</b> · {tr("Очки")}: {me[1]}</p> : <p className="muted">{trimName(name)}</p>}
      {sc && sc.board[0] && <p className="muted small">🥇 {sc.board[0][0]}: {sc.board[0][1]}</p>}
      <button className="btn" onClick={back}>{tr("Выйти")}</button>
    </div>
  );
}
