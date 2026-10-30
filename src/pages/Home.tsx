import { useMemo } from "react";
import { Avatar, studentColor } from "../components/ui";
import { createStudent } from "../game/generate";
import { levelOf, rankOf } from "../game/career";
import { useGame } from "../game/store";
import type { Nav } from "../App";

const HERO_SEEDS = [11, 25, 37, 49, 62];

export default function Home({ go, demo }: { go: Nav; demo: () => void }) {
  const { g } = useGame();
  const heroes = useMemo(() => HERO_SEEDS.map((s) => createStudent({ seed: s, blind: false })), []);
  const cases = Object.values(g.cases);
  const weeks = cases.reduce((a, c) => a + (c.finished ? 12 : c.week - 1), 0);
  const finished = cases.filter((c) => c.finished && c.finalScore != null);
  const avg = finished.length ? Math.round(finished.reduce((a, c) => a + (c.finalScore ?? 0), 0) / finished.length) : null;
  const lv = levelOf(g.curator.xp).level;
  const pos = [
    { left: 10, top: 20, size: 120 },
    { left: 150, top: 0, size: 150 },
    { left: 300, top: 40, size: 118 },
    { left: 70, top: 190, size: 136 },
    { left: 230, top: 200, size: 130 },
  ];

  return (
    <div className="stack" style={{ gap: 28 }}>
      <section className="hero">
        <div>
          <span className="pill">🎓 Тренажёр кураторов ЕНТ · по методике ALQA Academy</span>
          <h1 style={{ marginTop: 14 }}>Стань куратором,<br /><span className="grad">которому доверяют</span></h1>
          <p className="lead">
            У каждого ученика свой тип MBTI, своё эго-состояние, своя семья и свой курс. Выбирай тон общения, находи подход, выстраивай отношения: от «отстранённых» до «очень тёплых». Прокачивай навыки и веди учеников к гранту.
          </p>
          <div className="row wrap">
            <button className="btn lg" onClick={demo}>▶ Начать с демо-ученика</button>
            <button className="btn lg violet" onClick={() => go("studio")}>🧬 Создать ученика</button>
            <button className="btn lg ghost" onClick={() => go("knowledge")}>📚 База знаний</button>
          </div>
        </div>
        <div className="hero-cluster" aria-hidden>
          {heroes.map((s, i) => (
            <div key={s.id} className="av" style={{ left: pos[i].left, top: pos[i].top, animationDelay: `${-i * 1.1}s` }}>
              <Avatar look={s.look} gender={s.gender} size={pos[i].size} color={studentColor(s, true)} mood={0.85} stress={0.1} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid3">
        <div className="panel stat"><b>{g.students.length}</b><span className="muted">учеников в работе</span></div>
        <div className="panel stat"><b>{weeks}</b><span className="muted">недель прожито</span></div>
        <div className="panel stat"><b>{avg ?? "—"}</b><span className="muted">средний балл ЕНТ</span></div>
      </section>

      <section className="steps4">
        {[
          ["🧬", "Соберите ученика", "Тип, эго-состояние, семья, курс. Или случайный."],
          ["💬", "Ведите диалог", "Тон общения и тактика на каждой неделе."],
          ["🧭", "Составьте план", "Приёмы из воркбуков ALQA дают бонус."],
          ["📝", "Сдайте отчёт", "Ученик ответит, система разберёт ошибки."],
        ].map(([ic, t, d], i) => (
          <div key={t} className="step4"><span className="n">{i + 1}</span><div style={{ fontSize: "1.6rem" }}>{ic}</div><b>{t}</b><p className="muted small">{d}</p></div>
        ))}
      </section>

      <section className="grid3">
        <div className="feature"><div className="ic">🧬</div><h3>Живые ученики</h3><p className="muted small" style={{ marginTop: 6 }}>16 типов MBTI × 5 эго-состояний, семья, онлайн-курс, цель. Профиль скрыт, его нужно распознать.</p></div>
        <div className="feature"><div className="ic">💬</div><h3>Диалог и тон</h3><p className="muted small" style={{ marginTop: 6 }}>Отстранённо, нейтрально, хорошо, очень тепло. Слишком близко для чужих людей, слишком холодно для друзей: ученик это почувствует.</p></div>
        <div className="feature"><div className="ic">📝</div><h3>Отчёт и обратная связь</h3><p className="muted small" style={{ marginTop: 6 }}>Составь отчёт по ученику, и система ответит от его лица и разберёт твои ошибки по материалам ALQA.</p></div>
      </section>

      <section className="panel small muted">
        🛡️ <b>Этика.</b> Типы MBTI, эго-состояния и «чувствительные темы» это модели-гипотезы для тренировки общения, а не диагноз. Они не определяются по внешности, и ярлыки ученикам не называются. При тревожных сигналах куратор привлекает школьного психолога. <a href="#" onClick={(e) => { e.preventDefault(); go("knowledge"); }} style={{ color: "var(--accent)" }}>Правила куратора →</a>
      </section>

      <section className="panel row wrap" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="lbl">Твой путь</div>
          <h3>Уровень {lv} · {rankOf(lv).name}</h3>
          <p className="muted small">Опыт {g.curator.xp} · завершено сезонов: {g.curator.casesFinished}</p>
        </div>
        <div className="row wrap">
          {g.students.length > 0 && <button className="btn" onClick={() => go("roster")}>Мои ученики →</button>}
          <button className="btn ghost" onClick={() => go("career")}>Путь куратора</button>
        </div>
      </section>
    </div>
  );
}
