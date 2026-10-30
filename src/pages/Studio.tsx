import { useMemo, useState } from "react";
import { Avatar, studentColor } from "../components/ui";
import { EGO, EGO_ORDER } from "../data/ego";
import { TYPES, TYPE_CODES } from "../data/mbti";
import { WOUND_ORDER, WOUNDS, type WoundKey } from "../data/wounds";
import { COURSES, FAMILIES, GOALS, familyById, goalById } from "../data/world";
import { createStudent } from "../game/generate";
import { useGame } from "../game/store";
import type { EgoKey } from "../game/types";
import type { Nav } from "../App";
import { tr } from "../i18n";

const AXES: [string, string][] = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]];
const newSeed = () => Math.floor(Math.random() * 900000) + 100;

export default function Studio({ go }: { go: Nav }) {
  const { addStudent } = useGame();
  const [seed, setSeed] = useState(newSeed);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"f" | "m">("f");
  const [mbti, setMbti] = useState("ENFP");
  const [dom, setDom] = useState<EgoKey>("natural_child");
  const [sec, setSec] = useState<EgoKey>("adapted_child");
  const [fam, setFam] = useState("pressure");
  const [course, setCourse] = useState("c1");
  const [goal, setGoal] = useState("med");
  const [mock, setMock] = useState(70);
  const [blind, setBlind] = useState(false);
  const [wound, setWound] = useState<WoundKey | "">("");

  const st = useMemo(
    () => createStudent({ seed, name: name.trim() || undefined, gender, mbti, dominant: dom, second: sec, familyId: fam, courseId: course, goalId: goal, mock, blind, wound: wound || undefined }),
    [seed, name, gender, mbti, dom, sec, fam, course, goal, mock, blind, wound],
  );

  const setLetter = (i: number, l: string) => setMbti(mbti.split("").map((x, j) => (j === i ? l : x)).join(""));
  const randomize = () => {
    const s = newSeed();
    const t = TYPE_CODES[s % TYPE_CODES.length];
    setSeed(s);
    setGender(s % 2 ? "f" : "m");
    setMbti(t);
    const egos = EGO_ORDER;
    setDom(egos[s % 5]);
    setSec(egos[(s >> 3) % 5 === s % 5 ? ((s % 5) + 1) % 5 : (s >> 3) % 5]);
    setFam(FAMILIES[s % FAMILIES.length].id);
    setCourse(COURSES[(s >> 2) % COURSES.length].id);
    setGoal(GOALS[(s >> 4) % GOALS.length].id);
    setMock(50 + (s % 45));
    setName("");
  };
  const add = () => {
    addStudent(st);
    go("case", st.id);
  };
  const group = () => {
    for (let i = 0; i < 4; i++) {
      const s = createStudent({ seed: newSeed() + i * 7919, blind: true });
      addStudent(s);
    }
    go("roster");
  };

  const color = studentColor(st, true);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="center">
        <h2>{tr("Студия учеников")}</h2>
      </div>
      <div className="card center">
        <div style={{ display: "grid", placeItems: "center" }}>
          <Avatar look={st.look} gender={st.gender} size={120} color={color} mood={0.7} stress={0.2} />
        </div>
        <h2 style={{ marginTop: 10 }}>{st.name}, {st.age}</h2>
        <p className="muted small">{st.city} · {goalById(st.goalId).icon} {goalById(st.goalId).profession}</p>
        <p className="muted small" style={{ marginTop: 4 }}>{familyById(st.familyId).icon} {familyById(st.familyId).label}</p>
        <div className="row wrap" style={{ justifyContent: "center", marginTop: 18 }}>
          <button className="btn lg" onClick={add}>{tr("Добавить и начать →")}</button>
          <button className="btn lg ghost" onClick={randomize}>{tr("🎲 Случайный")}</button>
        </div>
      </div>
      <details>
        <summary>{tr("Настроить вручную")}</summary>
        <div className="stack" style={{ marginTop: 14 }}>
          <div className="grid2">
            <div className="field"><label>{tr("Имя (необязательно)")}</label><input type="text" value={name} placeholder={tr("Случайное")} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>{tr("Пол")}</label><div className="seg"><button className={gender === "f" ? "on" : ""} onClick={() => setGender("f")}>{tr("Девушка")}</button><button className={gender === "m" ? "on" : ""} onClick={() => setGender("m")}>{tr("Парень")}</button></div></div>
          </div>
          <div className="field">
            <label>{tr("Тип MBTI · {mbti} «{nick}»", { mbti, nick: TYPES[mbti].nick })}</label>
            <div className="row wrap">
              {AXES.map(([a, b], i) => (
                <div className="seg" key={a}>
                  <button className={mbti[i] === a ? "on" : ""} onClick={() => setLetter(i, a)}>{a}</button>
                  <button className={mbti[i] === b ? "on" : ""} onClick={() => setLetter(i, b)}>{b}</button>
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>{tr("Доминирующее эго-состояние")}</label>
            <div className="grid2" style={{ gap: 8 }}>
              {EGO_ORDER.map((k) => (
                <button key={k} className={`choice ${dom === k ? "on" : ""}`} onClick={() => { setDom(k); if (sec === k) setSec(EGO_ORDER.find((x) => x !== k)!); }}>
                  <b>{EGO[k].emoji} {EGO[k].name}</b>
                  <div className="xs muted">{EGO[k].coreProblem}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>{tr("Второе по силе эго-состояние")}</label>
            <select value={sec} onChange={(e) => setSec(e.target.value as EgoKey)}>
              {EGO_ORDER.filter((k) => k !== dom).map((k) => <option key={k} value={k}>{EGO[k].emoji} {EGO[k].name}</option>)}
            </select>
          </div>
          <div className="grid2">
            <div className="field"><label>{tr("Семья")}</label><select value={fam} onChange={(e) => setFam(e.target.value)}>{FAMILIES.map((f) => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select></div>
            <div className="field"><label>{tr("Цель")}</label><select value={goal} onChange={(e) => setGoal(e.target.value)}>{GOALS.map((g) => <option key={g.id} value={g.id}>{g.icon} {g.profession}</option>)}</select></div>
          </div>
          <div className="field"><label>{tr("Чувствительная тема")}</label><select value={wound} onChange={(e) => setWound(e.target.value as WoundKey | "")}><option value="">{tr("Определить автоматически")}</option>{WOUND_ORDER.map((w) => <option key={w} value={w}>{WOUNDS[w].emoji} {WOUNDS[w].name}</option>)}</select></div>
          <div className="field"><label>{tr("Онлайн-курс")}</label><select value={course} onChange={(e) => setCourse(e.target.value)}>{COURSES.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.price}</option>)}</select></div>
          <div className="field"><label>{tr("Стартовый балл на пробнике:")} {mock} / 140</label><input type="range" min={40} max={110} value={mock} onChange={(e) => setMock(+e.target.value)} /></div>
          <label className="row small" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} />
            {tr("Скрыть тип и эго-состояние (режим диагностики)")}
          </label>
        </div>

      </details>
      <div className="center"><button className="link" onClick={group}>{tr("👥 Случайная группа (4, вслепую)")}</button></div>
    </div>
  );
}
