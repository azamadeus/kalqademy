import { useEffect, useState } from "react";
import { EGO, EGO_ORDER } from "../data/ego";
import { GROUPS, TYPES, TYPE_CODES } from "../data/mbti";
import { INTERVENTIONS, WORKBOOKS } from "../data/workbooks";
import { CLOSENESS, TACTICS, TONES } from "../game/text";
import type { EgoKey, Tactic } from "../game/types";

type Sec = { heading: string; lines: string[] };
interface Docx { egoStates: Record<string, Sec[]>; types: Record<string, Sec[]> }
interface Pdf { pages: string[] }

const BASE = import.meta.env.BASE_URL;
const cache = new Map<string, Promise<unknown>>();
function useJson<T>(file: string | null): T | null | undefined {
  const [v, setV] = useState<T | null | undefined>(undefined);
  useEffect(() => {
    if (!file) return;
    let live = true;
    if (!cache.has(file)) cache.set(file, fetch(`${BASE}materials/${file}`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
    (cache.get(file) as Promise<T | null>).then((x) => live && setV(x));
    return () => { live = false; };
  }, [file]);
  return v;
}

function List({ items }: { items: string[] }) {
  return <ul className="list">{items.map((x) => <li key={x}>{x}</li>)}</ul>;
}

function Original({ sections, pdf, label = "Оригинал: методичка (қазақша, mbti_kz_1.docx)" }: { sections?: Sec[]; pdf?: string[] | null; label?: string }) {
  return (
    <div>
      {sections && sections.length > 0 && (
        <details>
          <summary>📄 {label}</summary>
          {sections.map((s, i) => (
            <div key={i} style={{ marginTop: 10 }}>
              {s.heading && <b className="small">{s.heading}</b>}
              <div className="src">{s.lines.filter(Boolean).join("\n")}</div>
            </div>
          ))}
        </details>
      )}
      {pdf && pdf.length > 0 && (
        <details>
          <summary>🖼 Оригинал: слайды ALQA ({pdf.length} стр., текст)</summary>
          {pdf.map((p, i) => (
            <div key={i} style={{ marginTop: 8 }}><span className="xs muted">Слайд {i + 1}</span><div className="src">{p}</div></div>
          ))}
        </details>
      )}
    </div>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn sm ghost" onClick={onClose}>Закрыть ✕</button></div>
        {children}
      </div>
    </div>
  );
}

function EgoModal({ k, onClose }: { k: EgoKey; onClose: () => void }) {
  const e = EGO[k];
  const docx = useJson<Docx>("docx.json");
  return (
    <Modal onClose={onClose}>
      <h2>{e.emoji} {e.name}</h2>
      <p className="muted" style={{ margin: "8px 0 14px" }}>{e.desc}</p>
      <div className="grid2">
        <div><h4>Как проявляется</h4><List items={e.signs} /><h4>Синдромы и роли</h4><List items={e.syndromes} /><h4>Корни (травмы)</h4><List items={e.traumas} /><h4>Глубинные убеждения</h4><List items={e.beliefs} /></div>
        <div>
          <h4>Как мотивировать</h4><List items={e.motivate} />
          <h4>Что говорить</h4>{e.say.map((x) => <div key={x} className="quote">{x}</div>)}
          <h4>Что ему нужно услышать</h4>{e.hear.map((x) => <div key={x} className="quote">{x}</div>)}
          <h4>Чего избегать</h4><List items={e.avoid} />
          <h4>Упражнения</h4><List items={e.exercises} />
        </div>
      </div>
      <p className="small muted" style={{ margin: "8px 0" }}>{e.low}</p>
      <Original sections={docx?.egoStates?.[k]} />
    </Modal>
  );
}

function TypeModal({ code, onClose }: { code: string; onClose: () => void }) {
  const t = TYPES[code];
  const docx = useJson<Docx>("docx.json");
  const pdf = useJson<Pdf>(`pdf-${code}.json`);
  const gr = GROUPS[t.group];
  return (
    <Modal onClose={onClose}>
      <h2><span style={{ color: gr.color }}>{t.code}</span> · {t.nick}</h2>
      <p className="muted small">{gr.name} · позиция в треугольнике Карпмана: {t.karpman.map((k) => ({ rescuer: "Спасатель", persecutor: "Преследователь", victim: "Жертва" })[k]).join(" / ")}</p>
      <p style={{ margin: "10px 0" }}>{t.summary}</p>
      <p className="muted small">{t.motives}</p>
      <div className="grid2" style={{ marginTop: 10 }}>
        <div><h4>Сильные стороны ученика</h4><List items={t.studentPlus} /><h4>Слабые стороны ученика</h4><List items={t.studentMinus} /><h4>Страхи</h4><List items={t.fears} /></div>
        <div><h4>Психологические трудности</h4><List items={t.problems} /><h4>Что работает</h4><List items={t.works} /><h4>Чего избегать</h4><List items={t.avoids} /></div>
      </div>
      <Original sections={docx?.types?.[code]} pdf={pdf?.pages} />
    </Modal>
  );
}

const TABS = ["Эго-состояния", "Типы MBTI", "Воркбуки", "Тон общения", "Тактики"] as const;

interface Wb { topics: { num: number; title: string; pages: string[] }[] }

export default function Knowledge() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Эго-состояния");
  const [ego, setEgo] = useState<EgoKey | null>(null);
  const [type, setType] = useState<string | null>(null);
  const wb = useJson<Wb>(tab === "Воркбуки" ? "workbooks.json" : null);
  return (
    <div className="stack">
      <div>
        <h2>База знаний</h2>
        <p className="muted small">Сводка по материалам ALQA Academy: эго-состояния, 16 типов MBTI и воркбуки по трансактному анализу. Внутри — оригиналы на казахском.</p>
      </div>
      <div className="row wrap gap8">
        {TABS.map((t) => <button key={t} className={`btn sm ${tab === t ? "" : "ghost"}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Эго-состояния" && (
        <div className="gridauto">
          {EGO_ORDER.map((k) => (
            <button key={k} className="tcard" style={{ borderColor: `${EGO[k].color}88` }} onClick={() => setEgo(k)}>
              <div style={{ fontSize: "2rem" }}>{EGO[k].emoji}</div>
              <b style={{ color: EGO[k].color }}>{EGO[k].name}</b>
              <p className="small muted" style={{ marginTop: 6 }}>{EGO[k].coreProblem}</p>
            </button>
          ))}
        </div>
      )}

      {tab === "Типы MBTI" && (
        <div className="stack">
          {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((gk) => (
            <div key={gk}>
              <div className="lbl" style={{ color: GROUPS[gk].color, marginBottom: 8 }}>{GROUPS[gk].name}</div>
              <div className="gridauto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                {TYPE_CODES.filter((c) => TYPES[c].group === gk).map((c) => (
                  <button key={c} className="tcard" style={{ borderColor: `${GROUPS[gk].color}88` }} onClick={() => setType(c)}>
                    <b style={{ color: GROUPS[gk].color }}>{c}</b> <span className="muted small">{TYPES[c].nick}</span>
                    <p className="xs muted" style={{ marginTop: 4 }}>{TYPES[c].summary.slice(0, 80)}…</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Воркбуки" && (
        <div className="stack">
          {WORKBOOKS.map((t) => {
            const src = wb?.topics?.find((x) => x.num === t.num);
            return (
              <div key={t.num} className="panel">
                <h3>Воркбук №{t.num}. {t.title}</h3>
                <p className="muted" style={{ margin: "8px 0" }}>{t.summary}</p>
                <div className="grid2">
                  <div><h4>Ключевые идеи</h4><List items={t.concepts} /></div>
                  <div><h4>Задания</h4><List items={t.tasks} /></div>
                </div>
                <h4>Приёмы для плана развития</h4>
                <div className="row wrap gap8" style={{ margin: "6px 0 10px" }}>
                  {INTERVENTIONS.filter((i) => i.wb === t.num).map((i) => <span key={i.id} className="pill" title={i.how}>{i.title}</span>)}
                </div>
                {src && <Original label="Оригинал воркбука (қазақша)" sections={[{ heading: "", lines: src.pages }]} />}
              </div>
            );
          })}
          <p className="xs muted">Загружено 12 из 13 воркбуков (№1–12). Оригиналы на казахском сохранены для №1–4 и 9–12; для №5–8 материалы пришли текстом, оригинал в базу не включён.</p>
        </div>
      )}

      {tab === "Тон общения" && (
        <div className="stack">
          <div className="grid2">
            {TONES.map((t) => (
              <div key={t.id} className="panel"><h3>{t.icon} {t.name}</h3><p className="muted small" style={{ marginTop: 6 }}>{t.desc}</p></div>
            ))}
          </div>
          <div className="panel">
            <h3>Лестница отношений</h3>
            <p className="muted small" style={{ margin: "6px 0 10px" }}>Доверие растёт, когда тон попадает в ожидания ученика. Слишком тёплый тон для малознакомых воспринимается как давление, слишком холодный для близких как безразличие.</p>
            {CLOSENESS.map((c) => <div key={c.name} className="perk" style={{ marginTop: 6 }}><span className="ic">{c.icon}</span><div><b>{c.name}</b> · от {c.from} доверия<div className="xs muted">{c.hint}</div></div></div>)}
          </div>
          <div className="panel">
            <h3>Кому какой тон обычно нужен</h3>
            <List items={["E и F: ближе к теплу, нужен живой контакт и признание", "I и T: сначала дистанция и уважение личных границ, теплота постепенно", "Приспосабливающийся и Естественный Ребёнок: нужна эмоциональная безопасность и тепло", "Взрослый и Критикующий Родитель: нейтральный, деловой тон, ясность", "С ростом доверия комфортная теплота растёт у всех"]} />
          </div>
        </div>
      )}

      {tab === "Тактики" && (
        <div className="gridauto">
          {(Object.keys(TACTICS) as Tactic[]).map((t) => (
            <div key={t} className="panel">
              <h3>{TACTICS[t].icon} {TACTICS[t].name}</h3>
              <p className="xs muted" style={{ margin: "6px 0" }}>Лучше всего работает с:</p>
              <div className="row wrap gap8">
                {EGO_ORDER.filter((k) => EGO[k].tactic[t] >= 1).map((k) => <span key={k} className="pill">{EGO[k].emoji} {EGO[k].name}</span>)}
                {EGO_ORDER.every((k) => EGO[k].tactic[t] < 1) && <span className="muted xs">зависит от ситуации и типа</span>}
              </div>
              <p className="xs muted" style={{ margin: "8px 0 4px" }}>Осторожно с:</p>
              <div className="row wrap gap8">
                {EGO_ORDER.filter((k) => EGO[k].tactic[t] <= -1).map((k) => <span key={k} className="pill">{EGO[k].emoji} {EGO[k].name}</span>)}
                {EGO_ORDER.every((k) => EGO[k].tactic[t] > -1) && <span className="muted xs">почти ко всем применима</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {ego && <EgoModal k={ego} onClose={() => setEgo(null)} />}
      {type && <TypeModal code={type} onClose={() => setType(null)} />}
    </div>
  );
}
