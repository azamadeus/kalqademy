import { useMemo, useState } from "react";
import { scenarios } from "./data/scenarios";
import { studentById, students } from "./data/students";
import {
  SKILLS,
  XP_PER_LEVEL,
  addXp,
  dominantEgo,
  emptyCurator,
  levelOf,
  titleOf,
  applyOption,
} from "./game/engine";
import { clearSave, loadSave, writeSave } from "./game/storage";
import type { Curator, Ego, Option, Outcome, Skill, Stats } from "./game/types";

const EGO_LABEL: Record<Ego, string> = {
  parent: "Родитель",
  adult: "Взрослый",
  child: "Дитя",
};

const RATING_LABEL = {
  good: "Отличное решение",
  ok: "Приемлемо",
  bad: "Неудачное решение",
} as const;

const initialStats = (): Record<string, Stats> =>
  Object.fromEntries(students.map((s) => [s.id, { ...s.start }]));

function Bar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const tone = invert ? 100 - value : value;
  const cls = tone >= 60 ? "good" : tone >= 35 ? "mid" : "low";
  return (
    <div className="bar">
      <div className="bar-head">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export default function App() {
  const saved = useMemo(() => loadSave(), []);
  const [curator, setCurator] = useState<Curator>(saved?.curator ?? emptyCurator());
  const [stats, setStats] = useState<Record<string, Stats>>(saved?.stats ?? initialStats());
  const [done, setDone] = useState<string[]>(saved?.done ?? []);
  const [picked, setPicked] = useState<{ option: Option; outcome: Outcome } | null>(null);

  const current = scenarios.find((s) => !done.includes(s.id));
  const finished = !current;

  const persist = (c: Curator, s: Record<string, Stats>, d: string[]) =>
    writeSave({ curator: c, stats: s, done: d });

  const choose = (option: Option) => {
    if (!current || picked) return;
    const student = studentById(current.studentId);
    const outcome = applyOption(stats[student.id], student, option);
    const nextStats = { ...stats, [student.id]: outcome.stats };
    const nextCurator = addXp(curator, outcome.xpGain, outcome.skillGain);
    const nextDone = [...done, current.id];
    setStats(nextStats);
    setCurator(nextCurator);
    setDone(nextDone);
    setPicked({ option, outcome });
    persist(nextCurator, nextStats, nextDone);
  };

  const restart = () => {
    clearSave();
    setCurator(emptyCurator());
    setStats(initialStats());
    setDone([]);
    setPicked(null);
  };

  const level = levelOf(curator.xp);
  const xpInLevel = curator.xp % XP_PER_LEVEL;

  const shown = picked
    ? scenarios.find((s) => s.id === done[done.length - 1])
    : current;
  const student = shown ? studentById(shown.studentId) : null;
  const ego = student ? dominantEgo(student) : null;

  return (
    <div className="layout">
      <aside className="panel curator">
        <h2>Куратор</h2>
        <div className="level">
          Ур. {level} · {titleOf(curator.xp)}
        </div>
        <Bar label={`Опыт (${xpInLevel}/${XP_PER_LEVEL})`} value={Math.round((xpInLevel / XP_PER_LEVEL) * 100)} />
        <h3>Навыки</h3>
        {(Object.keys(SKILLS) as Skill[]).map((k) => (
          <div className="skill" key={k}>
            <span>{SKILLS[k]}</span>
            <strong>{curator.skills[k]}</strong>
          </div>
        ))}
        <p className="progress">
          Ситуаций пройдено: {done.length}/{scenarios.length}
        </p>
        <button className="ghost" onClick={restart}>
          Начать заново
        </button>
      </aside>

      <main className="panel main">
        {finished && !picked ? (
          <div>
            <h1>Сезон завершён</h1>
            <p>Вы прошли все ситуации. Итоговый уровень: {level} — {titleOf(curator.xp)}.</p>
            <div className="grid">
              {students.map((s) => (
                <div className="card" key={s.id}>
                  <strong>{s.name}</strong> <small>{s.mbti}</small>
                  <Bar label="Доверие" value={stats[s.id].trust} />
                  <Bar label="Мотивация" value={stats[s.id].motivation} />
                  <Bar label="Стресс" value={stats[s.id].stress} invert />
                </div>
              ))}
            </div>
            <button onClick={restart}>Сыграть ещё раз</button>
          </div>
        ) : shown && student && ego ? (
          <div>
            <div className="student">
              <div>
                <h1>{student.name}, {student.age}</h1>
                <p className="tags">
                  <span className="tag">{student.mbti}</span>
                  <span className="tag">Доминирует: {EGO_LABEL[ego]}</span>
                  <span className="tag">Цель: {student.goal}</span>
                </p>
                <p className="bio">{student.bio}</p>
                <p className="hint">
                  Типы MBTI здесь описывают склонности, а не приговор. Реальный ученик сложнее.
                </p>
              </div>
              <div className="stats">
                <Bar label="Доверие" value={stats[student.id].trust} />
                <Bar label="Мотивация" value={stats[student.id].motivation} />
                <Bar label="Стресс" value={stats[student.id].stress} invert />
              </div>
            </div>

            <h2>{shown.title}</h2>
            <p>{shown.text}</p>

            <div className="options">
              {shown.options.map((o) => (
                <button
                  key={o.id}
                  className={`option ${picked?.option.id === o.id ? "picked" : ""}`}
                  disabled={!!picked}
                  onClick={() => choose(o)}
                >
                  {o.text}
                </button>
              ))}
            </div>

            {picked && (
              <div className={`feedback ${picked.outcome.rating}`}>
                <h3>{RATING_LABEL[picked.outcome.rating]}</h3>
                <p>{picked.option.feedback}</p>
                {picked.outcome.notes.map((n) => (
                  <p key={n} className="note">• {n}</p>
                ))}
                <p className="deltas">
                  Доверие {fmt(picked.outcome.delta.trust)} · Мотивация {fmt(picked.outcome.delta.motivation)} · Стресс {fmt(picked.outcome.delta.stress)} · Опыт +{picked.outcome.xpGain}
                </p>
                <button onClick={() => setPicked(null)}>
                  {current ? "Дальше" : "К итогам"}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
