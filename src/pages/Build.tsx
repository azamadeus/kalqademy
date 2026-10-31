import { useEffect, useMemo, useState } from "react";
import { Avatar, studentColor } from "../components/ui";
import { EGO, EGO_ORDER } from "../data/ego";
import { TYPE_EGO } from "../data/egogram";
import { TYPES, TYPE_CODES } from "../data/mbti";
import { WOUND_ORDER, WOUNDS, type WoundKey } from "../data/wounds";
import { dominantEgo, woundOf } from "../game/engine";
import { createStudent } from "../game/generate";
import type { EgoKey, Student } from "../game/types";
import { tr } from "../i18n";

export default function Build({ done, back }: { done: (s: Student) => void; back: () => void }) {
  const [mbti, setMbti] = useState("ENFP");
  const [egogram, setEgogram] = useState<Record<EgoKey, number>>({ ...TYPE_EGO.ENFP });
  const [gender, setGender] = useState<"f" | "m">("f");
  const [name, setName] = useState("");
  const [wound, setWound] = useState<WoundKey | "">("");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 900000) + 100);
  useEffect(() => { setEgogram({ ...TYPE_EGO[mbti] }); }, [mbti]);
  const st = useMemo(() => createStudent({ seed, mbti, ego: egogram, gender, name: name.trim() || undefined, wound: wound || undefined, blind: false }), [seed, mbti, egogram, gender, name, wound]);
  const top = EGO_ORDER.slice().sort((a, b) => egogram[b] - egogram[a])[0];

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="center"><h2>{tr("Собрать ученика")}</h2></div>
      <div className="card center">
        <div style={{ display: "grid", placeItems: "center" }}>
          <Avatar look={st.look} gender={st.gender} size={110} color={studentColor(st, true)} mood={0.5} stress={0.35} theme={woundOf(st)} outfit={dominantEgo(st)} />
        </div>
        <h3 style={{ marginTop: 8 }}>{st.name}, {st.age}</h3>
        <p className="muted small">{st.mbti} «{TYPES[st.mbti].nick}» · {EGO[top].emoji} {EGO[top].name}</p>
      </div>

      <div>
        <div className="step-title"><span className="num">1</span>{tr("Тип MBTI")}</div>
        <div className="types">
          {TYPE_CODES.map((c) => (
            <button key={c} className={`choice ${mbti === c ? "on" : ""}`} onClick={() => setMbti(c)}><b>{c}</b><div className="xs muted">{TYPES[c].nick}</div></button>
          ))}
        </div>
      </div>
      <div>
        <div className="step-title"><span className="num">2</span>{tr("Эгограмма: все пять состояний")}</div>
        <div className="sliders">
          {EGO_ORDER.map((k) => (
            <label key={k}>
              <span className="row" style={{ justifyContent: "space-between" }}><b className="small">{EGO[k].emoji} {EGO[k].name}</b><span className="xs muted">{egogram[k]}</span></span>
              <input type="range" min={0} max={100} value={egogram[k]} aria-label={EGO[k].name} onChange={(e) => setEgogram({ ...egogram, [k]: +e.target.value })} />
            </label>
          ))}
          <button className="link" style={{ justifySelf: "start" }} onClick={() => setEgogram({ ...TYPE_EGO[mbti] })}>{tr("Типичная эгограмма для типа")}</button>
        </div>
      </div>
      <div>
        <div className="step-title"><span className="num">3</span>{tr("Чувствительная тема")}</div>
        <div className="types">
          <button className={`choice ${wound === "" ? "on" : ""}`} onClick={() => setWound("")}><b>{tr("Авто")}</b></button>
          {WOUND_ORDER.map((w) => (
            <button key={w} className={`choice ${wound === w ? "on" : ""}`} onClick={() => setWound(w)}><b>{WOUNDS[w].emoji}</b><div className="xs muted">{WOUNDS[w].name}</div></button>
          ))}
        </div>
      </div>
      <div>
        <div className="step-title"><span className="num">4</span>{tr("Имя и пол")}</div>
        <div className="row wrap">
          <input type="text" style={{ flex: 1, minWidth: 160 }} value={name} placeholder={tr("Случайное")} aria-label={tr("Имя (необязательно)")} onChange={(e) => setName(e.target.value)} />
          <div className="seg"><button className={gender === "f" ? "on" : ""} onClick={() => setGender("f")}>{tr("Девушка")}</button><button className={gender === "m" ? "on" : ""} onClick={() => setGender("m")}>{tr("Парень")}</button></div>
        </div>
      </div>
      <div className="row wrap" style={{ justifyContent: "center" }}>
        <button className="btn lg" onClick={() => done(st)}>{tr("Создать ученика")}</button>
        <button className="btn lg ghost" onClick={() => setSeed(Math.floor(Math.random() * 900000) + 100)}>{tr("🎲 Другая внешность и история")}</button>
        <button className="link" onClick={back}>{tr("Назад")}</button>
      </div>
    </div>
  );
}
