import { Avatar, Bar, studentColor } from "../components/ui";
import { TYPES } from "../data/mbti";
import { goalById } from "../data/world";
import { CLOSENESS } from "../game/text";
import { STAGES, closenessLevel, stageOf } from "../game/engine";
import { useGame } from "../game/store";
import type { Nav } from "../App";

export default function Roster({ go }: { go: Nav }) {
  const { g, removeStudent } = useGame();
  if (!g.students.length) {
    return (
      <div className="panel empty">
        <div className="big">🎒</div>
        <h2>Пока нет учеников</h2>
        <p className="muted" style={{ margin: "8px 0 18px" }}>Создайте ученика вручную или получите случайную группу.</p>
        <button className="btn" onClick={() => go("studio")}>Создать ученика</button>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="row wrap" style={{ justifyContent: "space-between" }}>
        <h2>Мои ученики</h2>
        <button className="btn" onClick={() => go("studio")}>＋ Новый ученик</button>
      </div>
      <div className="gridauto">
        {g.students.map((s) => {
          const c = g.cases[s.id];
          const reveal = !s.blind;
          const color = studentColor(s, reveal);
          const lvl = closenessLevel(c.trust);
          const st = STAGES.find((x) => x.id === stageOf(c.week))!;
          return (
            <div key={s.id} className="panel scard" onClick={() => go("case", s.id)}>
              <div className="glow" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
              <div className="row">
                <Avatar look={s.look} gender={s.gender} size={84} color={color} mood={(c.motivation - c.stress + 100) / 200} stress={c.stress / 100} />
                <div className="grow">
                  <h3>{s.name}, {s.age}</h3>
                  <p className="muted small">{s.city}</p>
                  <p className="small">{goalById(s.goalId).icon} {goalById(s.goalId).profession}</p>
                </div>
              </div>
              <div className="row wrap gap8" style={{ margin: "12px 0 6px" }}>
                <span className="pill">{reveal ? `${s.mbti} · ${TYPES[s.mbti].nick}` : "❓ Профиль скрыт"}</span>
                <span className="pill">{c.finished ? "🏁 ЕНТ сдан" : `${st.icon} ${st.name} · нед. ${c.week}`}</span>
              </div>
              <Bar label="Доверие" value={c.trust} color="#34d399" />
              <p className="xs muted">{CLOSENESS[lvl].icon} Отношения: {CLOSENESS[lvl].name}{c.finalScore != null ? ` · ЕНТ: ${c.finalScore}` : ""}</p>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn sm grow" onClick={(e) => { e.stopPropagation(); go("case", s.id); }}>Открыть</button>
                <button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); go("report", s.id); }}>📝 Отчёт</button>
                <button className="btn sm ghost" aria-label="Удалить" onClick={(e) => { e.stopPropagation(); if (confirm(`Удалить ученика ${s.name}?`)) removeStudent(s.id); }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
