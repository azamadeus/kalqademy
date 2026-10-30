import { useMemo, useState } from "react";
import { Avatar, studentColor } from "../components/ui";
import { EGO, EGO_ORDER } from "../data/ego";
import { TYPES, TYPE_CODES } from "../data/mbti";
import { createStudent } from "../game/generate";
import type { EgoKey, Student } from "../game/types";
import { tr } from "../i18n";

export default function Build({ done, back }: { done: (s: Student) => void; back: () => void }) {
  const [mbti, setMbti] = useState("ENFP");
  const [ego, setEgo] = useState<EgoKey>("natural_child");
  const [gender, setGender] = useState<"f" | "m">("f");
  const [name, setName] = useState("");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 900000) + 100);
  const st = useMemo(() => createStudent({ seed, mbti, dominant: ego, gender, name: name.trim() || undefined, blind: false }), [seed, mbti, ego, gender, name]);

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="center"><h2>{tr("Собрать ученика")}</h2></div>
      <div className="card center">
        <div style={{ display: "grid", placeItems: "center" }}>
          <Avatar look={st.look} gender={st.gender} size={110} color={studentColor(st, true)} mood={0.7} stress={0.2} />
        </div>
        <h3 style={{ marginTop: 8 }}>{st.name}, {st.age}</h3>
        <p className="muted small">{st.mbti} «{TYPES[st.mbti].nick}» · {EGO[ego].emoji} {EGO[ego].name}</p>
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
        <div className="step-title"><span className="num">2</span>{tr("Доминирующее эго-состояние")}</div>
        <div className="stack" style={{ gap: 8 }}>
          {EGO_ORDER.map((k) => (
            <button key={k} className={`choice ${ego === k ? "on" : ""}`} onClick={() => setEgo(k)}>
              <b>{EGO[k].emoji} {EGO[k].name}</b><div className="xs muted">{EGO[k].coreProblem}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="step-title"><span className="num">3</span>{tr("Имя и пол")}</div>
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
