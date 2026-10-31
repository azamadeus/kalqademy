import { useEffect, useMemo, useState } from "react";
import { Avatar, studentColor } from "../components/ui";
import { dominantEgo, woundOf } from "../game/engine";
import { tr } from "../i18n";
import { cardOf, cardText } from "../quiz/group";

const KEY = "kq-decks";
const fresh = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 900000) + 100);
const readHash = () => { const m = location.hash.match(/^#group-([\d,]+)$/); const a = m ? m[1].split(",").map(Number).filter((x) => x > 0).slice(0, 12) : []; return a.length ? a : null; };
const loadSaved = (): { name: string; seeds: number[] }[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };

export default function Group({ back }: { back: () => void }) {
  const [seeds, setSeeds] = useState<number[]>(() => readHash() ?? fresh(6));
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [big, setBig] = useState(false);
  const [saved, setSaved] = useState(loadSaved);
  const [note, setNote] = useState("");
  const cards = useMemo(() => seeds.map(cardOf), [seeds]);
  const c = cards[Math.min(i, cards.length - 1)];
  useEffect(() => { history.replaceState(null, "", `#group-${seeds.join(",")}`); }, [seeds]);
  useEffect(() => { setShow(false); }, [i, seeds]);
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(""), 2200); };
  const save = () => {
    const next = [{ name: `${tr("Колода")} ${new Date().toLocaleDateString()} · ${seeds.length}`, seeds }, ...saved].slice(0, 12);
    setSaved(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage may be unavailable */ }
    flash(tr("Колода сохранена"));
  };
  const link = () => { navigator.clipboard?.writeText(location.href).then(() => flash(tr("Ссылка на колоду скопирована")), () => flash(location.href)); };
  const copy = () => { navigator.clipboard?.writeText(cardText(c)).then(() => flash(tr("Карточка скопирована")), () => flash(tr("Не удалось скопировать"))); };
  const go = (d: number) => setI((x) => (x + d + cards.length) % cards.length);

  const Card = ({ c: k, all }: { c: ReturnType<typeof cardOf>; all?: boolean }) => (
    <div className="stack gcard" style={{ gap: 14 }}>
      <div className="card center">
        <div style={{ display: "grid", placeItems: "center" }}>
          <Avatar look={k.student.look} gender={k.student.gender} size={all ? 90 : 120} color={studentColor(k.student, true)} mood={0.5} stress={0.35} theme={woundOf(k.student)} outfit={dominantEgo(k.student)} />
        </div>
        <h2 style={{ marginTop: 8 }}>{k.head}</h2>
        <div className="row wrap gap8" style={{ justifyContent: "center", marginTop: 6 }}>{k.badges.map((b) => <span key={b} className="pill">{b}</span>)}</div>
        <div className="gego">{k.ego.map((e) => (
          <div key={e.name} className="row" style={{ gap: 8, alignItems: "center" }}>
            <span className="xs" style={{ width: 190, textAlign: "left" }}>{e.emoji} {e.name}</span>
            <div className="thin" style={{ flex: 1 }}><i style={{ width: `${e.value}%`, background: e.color }} /></div>
            <span className="xs muted" style={{ width: 26 }}>{e.value}</span>
          </div>
        ))}</div>
      </div>
      <div className="gsec">
        {k.blocks.filter((b) => b.lines.length).map((b) => (
          <div key={b.head} className="card">
            <div className="step-title">{b.icon} {b.head}</div>
            {b.lines.map((l, n) => <p key={n} className="gline">{l}</p>)}
          </div>
        ))}
      </div>
      <div className="card gsit">
        <div className="step-title">❓ {tr("Ситуация")}: {k.situation.title}</div>
        <p className="gline gq">{k.situation.text}</p>
        <ol className="gdisc">{k.discuss.map((x) => <li key={x}>{x}</li>)}</ol>
      </div>
      {(all || show) && (
        <div className="stack" style={{ gap: 14 }}>
          {k.reveal.map((r) => (
            <div key={r.head} className="card greveal">
              <div className="step-title">🔓 {r.head}</div>
              {r.lines.map((l, n) => <p key={n} className="gline">{l}</p>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`stack group${big ? " gbig" : ""}`} style={{ gap: 16 }}>
      <div className="noprint stack" style={{ gap: 12 }}>
        <div className="row wrap" style={{ justifyContent: "space-between" }}>
          <h2>👥 {tr("Групповая практика")}</h2>
          <button className="link" onClick={back}>{tr("Назад")}</button>
        </div>
        <p className="small muted">{tr("Каждая группа берёт карточку ученика, обсуждает её и предлагает ответ куратора. Ответ ведущий открывает в конце.")}</p>
        <div className="row wrap gap8">
          {cards.map((k, n) => <button key={k.seed} className={`btn sm ${n === i ? "" : "ghost"}`} onClick={() => setI(n)}>{n + 1}. {k.student.name}</button>)}
        </div>
      </div>
      <div className="noprint"><Card c={c} /></div>
      <div className="print-only">{cards.map((k) => <div key={k.seed} className="pbreak"><Card c={k} all /></div>)}</div>
      <div className="noprint row wrap" style={{ justifyContent: "center" }}>
        <button className="btn ghost" onClick={() => go(-1)}>←</button>
        <button className="btn lg violet" onClick={() => setShow((x) => !x)}>{show ? tr("Скрыть разбор") : tr("Показать разбор")}</button>
        <button className="btn ghost" onClick={() => go(1)}>→</button>
      </div>
      <div className="noprint row wrap gap8" style={{ justifyContent: "center" }}>
        <button className="btn sm ghost" onClick={() => setBig((x) => !x)}>{big ? tr("Обычный шрифт") : tr("Крупно (проектор)")}</button>
        <button className="btn sm ghost" onClick={() => setSeeds(fresh(6))}>{tr("Новая колода")}</button>
        <button className="btn sm ghost" onClick={save}>{tr("Сохранить колоду")}</button>
        <button className="btn sm ghost" onClick={link}>{tr("Ссылка на колоду")}</button>
        <button className="btn sm ghost" onClick={copy}>{tr("Копировать карточку")}</button>
        <button className="btn sm ghost" onClick={() => window.print()}>{tr("Печать / PDF")}</button>
      </div>
      {note && <p className="small center noprint" role="status">{note}</p>}
      {saved.length > 0 && (
        <div className="card noprint">
          <div className="step-title">💾 {tr("Сохранённые колоды")}</div>
          {saved.map((d, n) => <div key={n} className="row" style={{ justifyContent: "space-between", marginTop: 6 }}><span className="small">{d.name}</span><button className="link" onClick={() => { setSeeds(d.seeds); setI(0); }}>{tr("Открыть")}</button></div>)}
        </div>
      )}
    </div>
  );
}
