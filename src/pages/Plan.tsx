import { useEffect, useState } from "react";
import { Avatar, Bar, Ring, studentColor } from "../components/ui";
import { INTERVENTIONS, interventionById } from "../data/workbooks";
import { PROBLEMS } from "../data/world";
import { STAGES } from "../game/engine";
import { emptyPlan } from "../game/plan";
import { useGame } from "../game/store";
import { TONES } from "../game/text";
import type { Plan, ProblemKey, Stage, Tone } from "../game/types";
import type { Nav } from "../App";
import { tr } from "../i18n";

export default function PlanPage({ sid, go }: { sid: string | null; go: Nav }) {
  const { g, plan: submit } = useGame();
  const student = g.students.find((s) => s.id === sid) ?? g.students[g.students.length - 1];
  const c = student ? g.cases[student.id] : undefined;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [all, setAll] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (student && c) setPlan(c.plan ? structuredClone(c.plan) : emptyPlan(student));
  }, [student?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!student || !c || !plan) {
    return (
      <div className="panel empty">
        <div className="big">🧭</div>
        <h2>{tr("Нет ученика для плана")}</h2>
        <p className="muted" style={{ margin: "8px 0 18px" }}>{tr("Создайте ученика, затем составьте для него план развития на 12 недель.")}</p>
        <button className="btn" onClick={() => go("studio")}>{tr("Создать ученика")}</button>
      </div>
    );
  }

  const reveal = !student.blind || c.finished;
  const color = studentColor(student, reveal);
  const res = c.planResult;
  const set = (patch: Partial<Plan>) => setPlan({ ...plan, ...patch });
  const toggleFocus = (p: ProblemKey) =>
    set({ focus: plan.focus.includes(p) ? plan.focus.filter((x) => x !== p) : plan.focus.length < 3 ? [...plan.focus, p] : plan.focus });
  const toggleIv = (stage: Stage, id: string) => {
    const cur = plan.steps[stage].interventionIds;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 2 ? [...cur, id] : cur;
    set({ steps: { ...plan.steps, [stage]: { ...plan.steps[stage], interventionIds: next } } });
  };
  const setNote = (stage: Stage, note: string) => set({ steps: { ...plan.steps, [stage]: { ...plan.steps[stage], note } } });
  const ready = plan.focus.length >= 1 && plan.tone != null && STAGES.some((s) => plan.steps[s.id].interventionIds.length > 0);

  return (
    <div className="stack">
      <div className="row wrap" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>{tr("План развития ученика")}</h2>
          <p className="muted small">{tr("Составьте план на 12 недель по приёмам из воркбуков ALQA. Хороший план даёт бонус в диалоге: когда ситуация совпадает с подготовленным приёмом, ход получается сильнее.")}</p>
        </div>
        <select aria-label={tr("Ученик")} style={{ width: "auto" }} value={student.id} onChange={(e) => go("plan", e.target.value)}>
          {g.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: "1.25fr 0.75fr", alignItems: "start" }}>
        <div className="stack">
          <div className="panel row">
            <Avatar look={student.look} gender={student.gender} size={64} color={color} mood={(c.motivation - c.stress + 100) / 200} stress={c.stress / 100} />
            <div className="grow"><h3>{student.name}, {student.age}</h3><p className="muted small">{tr("Неделя {week} из 12 · старт на пробнике: {mock}", { week: c.week, mock: student.mock })}</p></div>
            {res ? <span className="pill">{tr("📋 План:")} {res.score}/100</span> : <span className="pill">{tr("План не составлен")}</span>}
          </div>

          <div className="panel">
            <div className="step-title">{tr("1. Цель на ЕНТ: {goal} баллов (+{gain} к старту)", { goal: plan.goalScore, gain: plan.goalScore - student.mock })}</div>
            <input type="range" min={student.mock} max={140} value={plan.goalScore} onChange={(e) => set({ goalScore: +e.target.value })} aria-label={tr("Цель по баллам")} />
            <p className="xs muted">{tr("Реалистичный рост за 12 недель: примерно +15…+45 баллов.")}</p>
          </div>

          <div className="panel">
            <div className="step-title">{tr("2. Главные проблемные зоны ({n}/3)", { n: plan.focus.length })}</div>
            <div className="row wrap gap8">
              {(Object.keys(PROBLEMS) as ProblemKey[]).map((p) => (
                <button key={p} className={`choice ${plan.focus.includes(p) ? "on" : ""}`} style={{ padding: "7px 12px" }} onClick={() => toggleFocus(p)}>{PROBLEMS[p]}</button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="step-title">{tr("3. Тон общения в этой работе")}</div>
            <div className="tones">
              {TONES.map((t) => (
                <button key={t.id} className={`tone ${plan.tone === t.id ? "on" : ""}`} onClick={() => set({ tone: t.id as Tone })}><span className="ic">{t.icon}</span><b>{t.name}</b><small>{t.desc}</small></button>
              ))}
            </div>
          </div>

          <div className="panel stack">
            <div className="step-title" style={{ margin: 0 }}>{tr("4. Этапы: приёмы из воркбуков (до 2 на этап)")}</div>
            {STAGES.map((st) => {
              const picked = plan.steps[st.id].interventionIds;
              const list = INTERVENTIONS.filter((iv) => all[st.id] || iv.stages.includes(st.id));
              return (
                <div key={st.id} className="panel flat" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b>{st.icon} {st.name} · {tr("нед.")} {st.from}+</b>
                    <button className="btn sm ghost" onClick={() => setAll({ ...all, [st.id]: !all[st.id] })}>{all[st.id] ? tr("Только подходящие") : tr("Показать все")}</button>
                  </div>
                  <p className="xs muted">{st.hint}</p>
                  <div className="row wrap gap8" style={{ margin: "8px 0" }}>
                    {list.map((iv) => (
                      <button key={iv.id} className={`choice ${picked.includes(iv.id) ? "on" : ""}`} style={{ padding: "6px 10px", fontSize: "0.85rem" }} onClick={() => toggleIv(st.id, iv.id)} title={iv.how}>
                        {iv.title} <span className="xs muted">· {iv.wb === 0 ? tr("прил.") : `№${iv.wb}`}</span>
                      </button>
                    ))}
                  </div>
                  {picked.map((id) => <div key={id} className="quote">{interventionById(id)?.how}</div>)}
                  <textarea rows={2} placeholder={tr("Что конкретно вы сделаете на этом этапе?")} value={plan.steps[st.id].note} onChange={(e) => setNote(st.id, e.target.value)} />
                </div>
              );
            })}
          </div>

          <div className="panel">
            <div className="field"><label>{tr("5. Как поймёте, что план работает (метрики)")}</label><textarea rows={2} value={plan.metrics} placeholder={tr("Например: пробник +5 баллов каждые 2 недели, сон 7 ч, стресс ниже 40")} onChange={(e) => set({ metrics: e.target.value })} /></div>
            <div className="field"><label>{tr("6. Что скажете ученику, чтобы согласовать план")}</label><textarea rows={2} value={plan.message} placeholder={tr("Своими словами, в том тоне, который выбрали")} onChange={(e) => set({ message: e.target.value })} /></div>
            <div className="field" style={{ margin: 0 }}><label>{tr("7. Работа с семьёй")}</label><textarea rows={2} value={plan.family} placeholder={tr("Как и когда подключите родителей, что им скажете")} onChange={(e) => set({ family: e.target.value })} /></div>
          </div>

          <button className="btn lg" disabled={!ready} onClick={() => submit(student.id, plan)}>{res ? tr("Обновить план и пересчитать оценку") : tr("Утвердить план")}</button>
          {!ready && <p className="xs muted">{tr("Выберите хотя бы одну проблемную зону, тон и один приём.")}</p>}
        </div>

        <div className="stack" style={{ position: "sticky", top: 76 }}>
          {res ? (
            <div className="panel stack" style={{ gap: 14 }}>
              <div className="row" style={{ gap: 18 }}>
                <Ring value={res.score / 100} size={110} color={res.score >= 70 ? "#34d399" : res.score >= 40 ? "#fbbf24" : "#f87171"} big={res.score} small={tr("из 100")} />
                <div><h3>{tr("Оценка плана")}</h3><p className="muted small">{tr("Опыт +{xp}.", { xp: res.xp })} {res.score >= 60 ? tr("Бонус в диалоге: сильный") : res.score >= 35 ? tr("Бонус в диалоге: средний") : tr("Бонус в диалоге: слабый")}</p></div>
              </div>
              <div>
                <Bar label={tr("Цель")} value={res.parts.goal} color="#60a5fa" suffix="%" />
                <Bar label={tr("Приоритеты")} value={res.parts.focus} color="#a78bfa" suffix="%" />
                <Bar label={tr("Подходящесть приёмов")} value={res.parts.fit} color="#34d399" suffix="%" />
                <Bar label={tr("Полнота плана")} value={res.parts.complete} color="#fbbf24" suffix="%" />
                <Bar label={tr("Тон")} value={res.parts.tone} color="#f472b6" suffix="%" />
              </div>
              <div>
                <div className="lbl">{tr("Реакция ученика")}</div>
                <div className="row" style={{ alignItems: "flex-start", marginTop: 8 }}>
                  <Avatar look={student.look} gender={student.gender} size={44} color={color} mood={res.score / 100} stress={0.3} />
                  <div className="msg student" style={{ maxWidth: "none" }}>{res.studentMessage}</div>
                </div>
              </div>
              <div>
                <div className="lbl">{tr("Разбор")}</div>
                {res.expert.map((t, i) => <div key={i} className="quote">{t}</div>)}
              </div>
            </div>
          ) : (
            <div className="panel empty"><div className="big">📋</div><h3>{tr("Оценка появится здесь")}</h3><p className="muted small" style={{ marginTop: 6 }}>{tr("Утвердите план, и система сравнит его с реальным профилем ученика, а ученик ответит вам.")}</p></div>
          )}
          <button className="btn ghost" onClick={() => go("case", student.id)}>{tr("← Вернуться к диалогу")}</button>
        </div>
      </div>
    </div>
  );
}
