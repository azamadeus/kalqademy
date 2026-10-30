import { useMemo } from "react";
import { Avatar, studentColor } from "../components/ui";
import { createStudent } from "../game/generate";
import { useGame } from "../game/store";
import type { Nav } from "../App";
import { tr } from "../i18n";

export default function Home({ go, demo }: { go: Nav; demo: () => void }) {
  const { g } = useGame();
  const heroes = useMemo(() => [11, 37, 62].map((s) => createStudent({ seed: s, blind: false })), []);
  const active = g.students.find((s) => !g.cases[s.id]?.finished);

  return (
    <div className="home">
      <div className="faces" aria-hidden>
        {heroes.map((s) => <Avatar key={s.id} look={s.look} gender={s.gender} size={84} color={studentColor(s, true)} mood={0.85} stress={0.1} />)}
      </div>
      <h1>{tr("Стань куратором,")}<br /><span className="grad">{tr("которому доверяют")}</span></h1>
      <p className="lead">{tr("12 недель. Один ученик. Каждую неделю: выбери ответ и тон общения.")}</p>
      <div className="row wrap" style={{ justifyContent: "center" }}>
        {active ? (
          <>
            <button className="btn lg" onClick={() => go("case", active.id)}>{tr("Продолжить: {name}", { name: active.name })}</button>
            <button className="btn lg ghost" onClick={demo}>{tr("Новый ученик")}</button>
          </>
        ) : (
          <>
            <button className="btn lg" onClick={demo}>{tr("Начать")}</button>
            <button className="btn lg ghost" onClick={() => go("studio")}>{tr("Создать ученика")}</button>
          </>
        )}
      </div>
      <ol className="how">
        <li><b>1</b>{tr("Выберите ответ")}</li>
        <li><b>2</b>{tr("Выберите тон")}</li>
        <li><b>3</b>{tr("Смотрите результат")}</li>
      </ol>
      <p className="xs muted" style={{ maxWidth: 520, margin: "28px auto 0" }}>
        {tr("Типы MBTI, эго-состояния и «чувствительные темы» это модели-гипотезы для тренировки общения, а не диагноз.")}
      </p>
    </div>
  );
}
