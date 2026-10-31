import { useMemo } from "react";
import { Avatar, studentColor } from "../components/ui";
import { createStudent } from "../game/generate";
import { tr } from "../i18n";

export default function Home({ random, build, live, group }: { random: () => void; build: () => void; live: () => void; group: () => void }) {
  const heroes = useMemo(() => [11, 37, 62].map((s) => createStudent({ seed: s, blind: false })), []);
  return (
    <div className="home">
      <div className="faces" aria-hidden>
        {heroes.map((s) => <Avatar key={s.id} look={s.look} gender={s.gender} size={84} color={studentColor(s, true)} mood={0.85} stress={0.1} />)}
      </div>
      <h1>{tr("Стань куратором,")}<br /><span className="grad">{tr("которому доверяют")}</span></h1>
      <p className="lead">{tr("Познакомься с учеником, узнай его историю и выбери лучший ответ в 10 ситуациях.")}</p>
      <div className="row wrap" style={{ justifyContent: "center" }}>
        <button className="btn lg" onClick={random}>{tr("🎲 Случайный ученик")}</button>
        <button className="btn lg ghost" onClick={build}>{tr("Собрать ученика")}</button>
        <button className="btn lg ghost" onClick={live}>{tr("🎮 Живая игра")}</button>
        <button className="btn lg ghost" onClick={group}>{tr("👥 Групповая практика")}</button>
      </div>
      <p className="xs muted" style={{ maxWidth: 520, margin: "28px auto 0" }}>
        {tr("Типы MBTI, эго-состояния и «чувствительные темы» это модели-гипотезы для тренировки общения, а не диагноз.")}
      </p>
    </div>
  );
}
