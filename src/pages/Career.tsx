import { Radar, Ring } from "../components/ui";
import { ACHIEVEMENTS, PERKS, RANKS, SKILLS, levelOf, rankOf } from "../game/career";
import { useGame } from "../game/store";
import type { SkillKey } from "../game/types";

export default function Career() {
  const { g, setName, reset } = useGame();
  const { level, into, need } = levelOf(g.curator.xp);
  const next = RANKS.find((r) => r.level > level);
  return (
    <div className="stack">
      <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="panel row wrap" style={{ gap: 22 }}>
          <Ring value={into / need} size={140} stroke={12} color="#fbbf24" big={level} small="уровень" />
          <div className="grow">
            <div className="lbl">Куратор</div>
            <input type="text" value={g.curator.name} onChange={(e) => setName(e.target.value)} aria-label="Имя куратора" style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 8 }} />
            <h3>{rankOf(level).name}</h3>
            <p className="muted small">Опыт до следующего уровня: {need - into}{next ? ` · дальше: ${next.name} (ур. ${next.level})` : ""}</p>
            <p className="muted small">Завершено сезонов: {g.curator.casesFinished}</p>
          </div>
        </div>
        <div className="panel center"><Radar skills={g.curator.skills} /></div>
      </div>

      <div className="panel">
        <h3>Навыки</h3>
        <div className="grid3" style={{ marginTop: 12 }}>
          {(Object.keys(SKILLS) as SkillKey[]).map((k) => (
            <div key={k} className="perk"><span className="ic">{SKILLS[k].icon}</span><div className="grow"><b>{SKILLS[k].name}</b><div className="xs muted">{SKILLS[k].desc}</div></div><b>{g.curator.skills[k]}</b></div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Ступени и возможности</h3>
        <div className="grid2" style={{ marginTop: 12 }}>
          {PERKS.map((p) => (
            <div key={p.name} className={`perk ${level >= p.level ? "" : "locked"}`}>
              <span className="ic">{p.icon}</span>
              <div className="grow"><b>{p.name}</b><div className="xs muted">{p.desc}</div></div>
              <span className="pill">{level >= p.level ? "открыто" : `ур. ${p.level}`}</span>
            </div>
          ))}
        </div>
        <div className="row wrap gap8" style={{ marginTop: 14 }}>
          {RANKS.map((r) => <span key={r.level} className="pill" style={level >= r.level ? { borderColor: "#fbbf24", color: "#fbbf24" } : { opacity: 0.5 }}>{r.level}. {r.name}</span>)}
        </div>
      </div>

      <div className="panel">
        <h3>Достижения · {g.achievements.length}/{ACHIEVEMENTS.length}</h3>
        <div className="gridauto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", marginTop: 12 }}>
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={`ach ${g.achievements.includes(a.id) ? "" : "locked"}`}>
              <span className="ic">{a.icon}</span><b>{a.name}</b><div className="xs muted">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn ghost sm" onClick={() => { if (confirm("Стереть весь прогресс и учеников?")) reset(); }}>Сбросить прогресс</button>
      </div>
    </div>
  );
}
