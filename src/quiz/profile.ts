import { EGO_ORDER } from "../data/ego";
import { driversOf, type BanKey, type DriverKey } from "../data/drivers";
import { TYPES } from "../data/mbti";
import { woundOf, dominantEgo } from "../game/engine";
import type { EgoKey, Karpman, Student } from "../game/types";
import { LANG } from "../i18n";

type Pair = [string, string];
const L = (p: Pair) => (LANG === "kk" ? p[1] : p[0]);

export type Position = "okok" | "okno" | "nook" | "nono";
export type Script = "winner" | "nonwinner" | "loser";
export type Attention = "useful" | "criticize" | "achieve" | "helpless" | "show";
export type FreeChild = "positive" | "too";

/** Life positions of transactional analysis ("I'm OK / You're OK" and the others). */
export const POSITIONS: Record<Position, { name: Pair; line: Pair }> = {
  okok: { name: ["Я хороший, ты хороший", "Мен жақсымын, сен жақсысың"], line: ["Здоровая позиция: открыт к людям и к себе", "Сау позиция: адамдарға да, өзіне де ашық"] },
  okno: { name: ["Я хороший, ты плохой", "Мен жақсымын, сен жаман"], line: ["Высокомерие: «я прав, другие виноваты»", "Менмендік: «мен дұрыспын, өзгелер кінәлі»"] },
  nook: { name: ["Я плохой, ты хороший", "Мен жаманмын, сен жақсысың"], line: ["Позиция жертвы: «другие лучше и сильнее меня»", "Құрбан позициясы: «өзгелер менен жақсы әрі күшті»"] },
  nono: { name: ["Я плохой, ты плохой", "Мен жаманмын, сен жаман"], line: ["Безнадёжность: «никто и ничто не поможет»", "Үмітсіздік: «ешкім де, ешнәрсе де көмектеспейді»"] },
};

/** Script types: winner, "non-winner" and loser (training labels for tendencies, not verdicts). */
export const SCRIPTS: Record<Script, { name: Pair; line: Pair }> = {
  winner: { name: ["Победитель", "Жеңімпаз"], line: ["Ставит цели и доводит до конца, видит в трудностях задачи", "Мақсат қояды және соңына дейін жеткізеді, қиындықты тапсырма ретінде көреді"] },
  nonwinner: { name: ["Непобедитель", "Жеңімпаз емес"], line: ["«И так сойдёт»: не проигрывает, но и не рискует выиграть", "«Солай да болады»: ұтылмайды, бірақ ұтуға тәуекел де етпейді"] },
  loser: { name: ["Проигравший (по сценарию)", "Сценарий бойынша ұтылушы"], line: ["Ждёт неудачи заранее, ищет, кто виноват", "Сәтсіздікті алдын ала күтеді, кінәліні іздейді"] },
};

export const ROLES: Record<Karpman, { name: Pair; line: Pair }> = {
  rescuer: { name: ["Спасатель", "Құтқарушы"], line: ["Помогает, даже когда не просят, и устаёт", "Сұрамаса да көмектеседі де, шаршайды"] },
  persecutor: { name: ["Преследователь", "Қудалаушы"], line: ["Контролирует, требует, критикует", "Бақылайды, талап етеді, сынайды"] },
  victim: { name: ["Жертва", "Құрбан"], line: ["«Я не справляюсь», ждёт, что решат за него", "«Мен үлгермеймін», орнына шешеді деп күтеді"] },
};

/** How the student gets attention ("strokes"): useful, critical, successful, helpless or striking. */
export const ATTENTIONS: Record<Attention, { name: Pair; line: Pair }> = {
  useful: { name: ["Быть полезным", "Пайдалы болу"], line: ["«Давай помогу»: внимание через заботу о других", "«Көмектесейін»: өзгеге қамқорлық арқылы назар алу"] },
  criticize: { name: ["Требовать и критиковать", "Талап ету және сынау"], line: ["«Опять всё не так»: внимание через строгость, включая негативное", "«Тағы бәрі дұрыс емес»: қатаңдық арқылы, жағымсыз назарды қоса"] },
  achieve: { name: ["Достижения и логика", "Жетістік және логика"], line: ["«Я сам, посмотрите на результат»: внимание через успех", "«Мен өзім, нәтижеге қараңыз»: табыс арқылы назар"] },
  helpless: { name: ["«Помоги или отругай»", "«Көмектес немесе ұрыс»"], line: ["«Я не справляюсь»: внимание через беспомощность, пусть даже ругань", "«Мен үлгермеймін»: дәрменсіздік арқылы, тіпті ұрыс болса да"] },
  show: { name: ["Яркость и выходки", "Жарқындық және әрекеттер"], line: ["«Заметь меня»: внимание через шутки, шум и нарушение правил", "«Мені байқа»: әзіл, шу және ережені бұзу арқылы"] },
};

/** Two kinds of Free Child. */
export const FREE_CHILD: Record<FreeChild, { name: Pair; line: Pair }> = {
  positive: { name: ["Свободный Ребёнок позитивный", "Позитивті Еркін Бала"], line: ["Творчество, радость, любопытство, умеет договариваться", "Шығармашылық, қуаныш, қызығушылық, келісе біледі"] },
  too: { name: ["Слишком свободный Ребёнок", "Тым еркін Бала"], line: ["Импульсивность, «хочу сейчас», бунт против правил, срывы дедлайнов", "Импульсивтілік, «қазір қалаймын», ережеге қарсы бүлік, мерзімді бұзу"] },
};

/** Extra prohibitions that the materials describe for the ego states. */
export const EXTRA_BANS: Record<string, Pair> = {
  grow: ["Не взрослей", "Есейме"],
  healthy: ["Не будь здоровым", "Дені сау болма"],
  think: ["Не думай", "Ойлама"],
  succeed: ["Не добивайся успеха", "Жетістікке жетпе"],
  belong: ["Не принадлежи", "Топқа тиесілі болма"],
};

export interface TAProfile {
  position: Position;
  script: Script;
  role: Karpman;
  attention: Attention;
  freeChild: FreeChild | null;
  drivers: DriverKey[];
  bans: (BanKey | string)[];
  dominant: EgoKey;
}

const ATTENTION_BY_EGO: Record<EgoKey, Attention> = { caring_parent: "useful", critical_parent: "criticize", adult: "achieve", adapted_child: "helpless", natural_child: "show" };
const EXTRA_BAN_BY_EGO: Partial<Record<EgoKey, string>> = { caring_parent: "healthy", adapted_child: "grow", natural_child: "succeed", adult: "belong", critical_parent: "think" };

/** The student's deeper profile, derived from the egogram, type and sensitive theme. A training model, not a diagnosis. */
export function taProfileOf(s: Student): TAProfile {
  const total = EGO_ORDER.reduce((a, k) => a + s.ego[k], 0) || 1;
  const sh = Object.fromEntries(EGO_ORDER.map((k) => [k, s.ego[k] / total])) as Record<EgoKey, number>;
  const w = woundOf(s);
  const dom = dominantEgo(s);
  const scores: Record<Position, number> = {
    okok: sh.adult * 3.4 + sh.natural_child * 1.4 - sh.adapted_child * 0.6 - sh.critical_parent * 0.9,
    okno: sh.critical_parent * 2.4 + (w === "betrayal" || w === "injustice" ? 0.5 : 0) + sh.natural_child * 0.3,
    nook: sh.adapted_child * 2.4 + sh.caring_parent * 0.6 + (w === "rejection" || w === "humiliation" || w === "abandonment" ? 0.5 : 0),
    nono: Math.min(sh.adapted_child, sh.critical_parent) * 5.2,
  };
  const position = (Object.keys(scores) as Position[]).sort((a, b) => scores[b] - scores[a])[0];
  const script: Script = sh.adult >= 0.24 && sh.adapted_child <= 0.25 ? "winner" : (sh.adapted_child >= 0.25 && (w === "rejection" || w === "humiliation" || w === "abandonment")) || sh.adapted_child >= 0.3 ? "loser" : "nonwinner";
  const freeChild: FreeChild | null = s.ego.natural_child >= 55 ? (s.ego.adult <= 38 ? "too" : "positive") : null;
  const d = driversOf(s.mbti);
  const bans: (BanKey | string)[] = [...d.bans];
  const extra = EXTRA_BAN_BY_EGO[dom];
  if (extra && !bans.includes(extra)) bans.push(extra);
  return { position, script, role: dom === "adapted_child" ? "victim" : TYPES[s.mbti].karpman[0], attention: ATTENTION_BY_EGO[dom], freeChild, drivers: d.drivers, bans, dominant: dom };
}

export const label = (p: Pair) => L(p);
