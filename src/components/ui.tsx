import { useEffect, useState, type ReactNode } from "react";
import { GROUPS, groupOf } from "../data/mbti";
import { CLOSENESS } from "../game/text";
import { SKILLS } from "../game/career";
import { STAGES, TOTAL_WEEKS, stageOf, closenessLevel } from "../game/engine";
import type { Look, SkillKey, Student } from "../game/types";
import { clamp } from "../game/rng";

const SKIN = ["#f5d0b5", "#e8b98f", "#d39b6e", "#b9784c", "#8d5a3a"];
const HAIR = ["#2b2118", "#4a3222", "#7a4a2a", "#1a1a24", "#a0522d", "#c9a06a"];

export function Avatar({
  look, mood = 0.6, stress = 0.3, size = 120, color, gender = "f", mark,
}: { look: Look; mood?: number; stress?: number; size?: number; color?: string; gender?: "f" | "m"; mark?: string }) {
  const skin = SKIN[look.skin % SKIN.length];
  const hair = HAIR[look.hairColor % HAIR.length];
  const c = color ?? "#64748b";
  const m = clamp(mood, 0, 1);
  const smile = 70 + (m - 0.5) * 20;
  const worry = clamp(stress, 0, 1) * 5;
  const id = `g${look.skin}${look.hair}${look.hairColor}${look.accessory}${c.slice(1)}`;
  const style = gender === "f" ? [1, 5, 2, 3, 1, 5][look.hair % 6] : [0, 4, 0, 4, 3, 0][look.hair % 6];
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Аватар ученика">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.95" />
          <stop offset="1" stopColor={c} stopOpacity="0.35" />
        </linearGradient>
        <clipPath id={`c${id}`}><circle cx="60" cy="60" r="58" /></clipPath>
      </defs>
      <circle cx="60" cy="60" r="58" fill={`url(#${id})`} />
      <g clipPath={`url(#c${id})`}>
        {(style === 1 || style === 5) && <path d="M32 58 Q28 20 60 20 Q92 20 88 58 L92 100 L72 100 L72 72 L48 72 L48 100 L28 100 Z" fill={hair} />}
        <path d="M14 125 Q18 90 60 88 Q102 90 106 125 Z" fill={c} style={{ filter: "brightness(0.65)" }} />
        <rect x="51" y="70" width="18" height="20" rx="6" fill={skin} />
        <ellipse cx="36.5" cy="58" rx="4" ry="6" fill={skin} />
        <ellipse cx="83.5" cy="58" rx="4" ry="6" fill={skin} />
        <ellipse cx="60" cy="56" rx="24" ry="28" fill={skin} />
        {style === 0 && <path d="M35 52 Q34 22 60 22 Q86 22 85 52 Q76 38 60 38 Q44 38 35 52Z" fill={hair} />}
        {style === 1 && <path d="M35 50 Q60 18 85 50 Q60 34 35 50Z" fill={hair} />}
        {style === 2 && <><circle cx="60" cy="16" r="11" fill={hair} /><path d="M35 50 Q34 22 60 24 Q86 22 85 50 Q60 34 35 50Z" fill={hair} /></>}
        {style === 3 && <>{[40, 50, 60, 70, 80].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 26 : 30} r="11" fill={hair} />)}<path d="M36 50 Q60 34 84 50 Q84 40 60 36 Q36 40 36 50Z" fill={hair} /></>}
        {style === 4 && <path d="M35 50 L38 26 L47 36 L53 20 L60 34 L68 20 L73 36 L82 26 L85 50 Q60 36 35 50Z" fill={hair} />}
        {style === 5 && <path d="M34 62 Q30 22 60 22 Q90 22 86 62 L86 70 Q76 68 76 48 Q60 38 44 48 Q44 68 34 70Z" fill={hair} />}
        <path d={`M44 ${47 - worry * 0.4} L56 ${46 + worry * 0.6}`} stroke="#241c1c" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d={`M76 ${47 - worry * 0.4} L64 ${46 + worry * 0.6}`} stroke="#241c1c" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <circle cx="50" cy="56" r="3.2" fill="#1b1b2b" /><circle cx="70" cy="56" r="3.2" fill="#1b1b2b" />
        <circle cx="51" cy="55" r="1" fill="#fff" /><circle cx="71" cy="55" r="1" fill="#fff" />
        <path d={`M50 70 Q60 ${smile} 70 70`} stroke="#8a3b3b" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        {m > 0.65 && <><circle cx="44" cy="66" r="4" fill="#ff7a9a" opacity="0.35" /><circle cx="76" cy="66" r="4" fill="#ff7a9a" opacity="0.35" /></>}
        {look.accessory === 1 && <g stroke="#1f2937" strokeWidth="2" fill="rgba(255,255,255,0.12)"><circle cx="50" cy="56" r="8" /><circle cx="70" cy="56" r="8" /><path d="M58 56 H62" /></g>}
        {look.accessory === 2 && <g fill="#1f2937"><path d="M34 56 Q34 24 60 24 Q86 24 86 56" fill="none" stroke="#1f2937" strokeWidth="4" /><rect x="29" y="52" width="9" height="16" rx="4" /><rect x="82" y="52" width="9" height="16" rx="4" /></g>}
        {look.accessory === 3 && <circle cx="37" cy="64" r="2.6" fill="#fbbf24" />}
      </g>
      <circle cx="60" cy="60" r="57" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      {mark && <text x="95" y="24" fontSize="26" textAnchor="middle">{mark}</text>}
    </svg>
  );
}

export const studentColor = (s: Student, reveal: boolean) => (reveal ? GROUPS[groupOf(s.mbti)].color : "#64748b");

export function Ring({ value, size = 110, stroke = 10, color = "#34d399", big, small }: { value: number; size?: number; stroke?: number; color?: string; big?: ReactNode; small?: ReactNode }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(clamp(value, 0, 1)), 60);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
        <circle className="fg" cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - v)} />
      </svg>
      <div className="lab"><b>{big}</b><small>{small}</small></div>
    </div>
  );
}

export function Bar({ label, value, color, suffix = "", invert }: { label: string; value: number; color: string; suffix?: string; invert?: boolean }) {
  const v = clamp(value);
  const shade = invert ? (v > 66 ? "#f87171" : v > 40 ? "#fbbf24" : color) : color;
  return (
    <div className="bar">
      <div className="top"><span>{label}</span><b>{Math.round(v)}{suffix}</b></div>
      <div className="track"><div className="fill" style={{ width: `${v}%`, background: shade }} /></div>
    </div>
  );
}

export function Ladder({ trust }: { trust: number }) {
  const lvl = closenessLevel(trust);
  return (
    <div>
      <div className="ladder">
        {CLOSENESS.map((c, i) => (
          <div key={c.name} className={`rung ${i < lvl ? "done" : ""} ${i === lvl ? "cur" : ""}`}>
            <span className="ic">{c.icon}</span>{c.name}
          </div>
        ))}
      </div>
      <p className="xs muted center" style={{ marginTop: 6 }}>{CLOSENESS[lvl].hint} · доверие {Math.round(trust)}/100</p>
    </div>
  );
}

export function StageTrack({ week }: { week: number }) {
  const cur = stageOf(week);
  const idx = STAGES.findIndex((s) => s.id === cur);
  return (
    <div>
      <div className="stages">
        {STAGES.map((s, i) => (
          <div key={s.id} className={`stage ${i < idx ? "done" : ""} ${i === idx ? "cur" : ""}`}><i />{s.icon} {s.name}</div>
        ))}
      </div>
      <p className="xs muted center" style={{ marginTop: 6 }}>Неделя {week} из {TOTAL_WEEKS}</p>
    </div>
  );
}

export function Radar({ skills, size = 280 }: { skills: Record<SkillKey, number>; size?: number }) {
  const keys = Object.keys(SKILLS) as SkillKey[];
  const max = Math.max(10, ...keys.map((k) => skills[k]));
  const c = size / 2;
  const R = size / 2 - 46;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v] as const;
  };
  const poly = keys.map((k, i) => pt(i, skills[k] / max).join(",")).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: "100%" }}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={keys.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.12)" />
      ))}
      {keys.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="rgba(255,255,255,0.1)" />)}
      <polygon points={poly} fill="rgba(52,211,153,0.3)" stroke="#34d399" strokeWidth="2.5" />
      {keys.map((k, i) => {
        const [x, y] = pt(i, 1.2);
        return <text key={k} x={x} y={y} fill="#cbd5f5" fontSize="12" textAnchor="middle" dominantBaseline="middle">{SKILLS[k].icon} {SKILLS[k].name}</text>;
      })}
    </svg>
  );
}

const COLORS = ["#34d399", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171", "#f472b6"];
export function Confetti({ fire }: { fire: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!fire) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 4200);
    return () => clearTimeout(t);
  }, [fire]);
  if (!on) return null;
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 70 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % COLORS.length], animationDuration: `${2.4 + (i % 7) * 0.35}s`, animationDelay: `${(i % 10) * 0.07}s`, transform: `rotate(${i * 25}deg)` }} />
      ))}
    </div>
  );
}

export function Delta({ label, v, goodWhenDown }: { label: string; v: number; goodWhenDown?: boolean }) {
  const good = goodWhenDown ? v < 0 : v > 0;
  return <span className={`delta ${v === 0 ? "" : good ? "up" : "down"}`}>{label} {v > 0 ? "+" : ""}{v}</span>;
}
