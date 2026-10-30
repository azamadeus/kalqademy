import type { Student } from "../game/types";
import { dominantEgo, preferredWarmth, woundOf } from "../game/engine";
import { WOUNDS } from "./wounds";
import { TYPES } from "./mbti";
import { courseById, familyById, goalById } from "./world";

export interface Question {
  id: string;
  text: string;
  /** Which part of the dossier it sheds light on. */
  about: string;
  /** Needs at least this relationship level (0..3) to be answered openly. */
  needs: number;
  answer: (s: Student) => string;
}

const pair = (s: Student, idx: number, a: string, b: string) => (s.mbti[idx] === a[0] ? a.slice(1) : b.slice(1));

export const GUARDED = "Я пока не готов{а} об этом говорить. Мы мало знакомы…";

export const QUESTIONS: Question[] = [
  {
    id: "evening", text: "Как ты обычно проводишь вечер после занятий?", about: "Энергия (E/I)", needs: 0,
    answer: (s) => pair(s, 0, "EВечером зову друзей, ходим куда-нибудь или хотя бы созваниваемся. Одному дома скучно.", "IВечером хочу побыть один: музыка, книга или сериал. После людей нужно восстановиться."),
  },
  {
    id: "plan", text: "Как у тебя с планом подготовки?", about: "Организация (J/P)", needs: 0,
    answer: (s) => pair(s, 3, "JЯ люблю план: расписание по часам, галочки в чек-листе. Когда всё по плану, мне спокойнее.", "PПлан? Я скорее по настроению. Берусь, когда включается интерес. Жёсткое расписание давит."),
  },
  {
    id: "learn", text: "Что тебе проще: примеры и факты или идеи и общая картина?", about: "Восприятие (S/N)", needs: 0,
    answer: (s) => pair(s, 1, "SМне проще на примерах и задачах. Покажите, как решать, и я повторю. Теория без примеров не заходит.", "NМне важнее понять идею и как всё связано. Формулы без смысла сразу забываю."),
  },
  {
    id: "argue", text: "Когда ты споришь: что важнее, логика или чувства людей?", about: "Решения (T/F)", needs: 0,
    answer: (s) => pair(s, 2, "TВ споре важнее логика: если аргументы верные, я соглашусь, даже если неприятно.", "FДля меня важнее, чтобы никого не задеть. Могу уступить, лишь бы не было ссоры."),
  },
  {
    id: "lowscore", text: "Что ты чувствуешь, когда получаешь низкий балл на пробнике?", about: "Эго-состояние", needs: 1,
    answer: (s) =>
      ({
        caring_parent: "Если честно, переживаю больше за близких: как они расстроятся. О себе думаю в последнюю очередь.",
        critical_parent: "Злюсь на себя. Каждая ошибка как приговор. Если не идеально, значит, я плохо старал{ся|ась}.",
        adult: "Смотрю на цифры, разбираю по темам. Эмоции? Ну… расстроил{ся|ась}, но это не помогает.",
        adapted_child: "Прячу результат и никому не показываю. Боюсь, что скажут «ну опять».",
        natural_child: "Сначала обидно, потом отвлекаюсь: игры, друзья. Скучно сидеть и разбирать ошибки.",
      })[dominantEgo(s)],
  },
  { id: "family", text: "Что говорят дома про ЕНТ?", about: "Семья", needs: 1, answer: (s) => familyById(s.familyId).voice },
  { id: "course", text: "Почему ты купил{а} именно этот курс?", about: "Курс", needs: 0, answer: (s) => courseById(s.courseId).voice },
  {
    id: "goal", text: "Кем ты хочешь стать?", about: "Цель", needs: 0,
    answer: (s) => {
      const g = goalById(s.goalId);
      const pressed = ["pressure", "compare", "tight"].includes(s.familyId) || dominantEgo(s) === "adapted_child";
      return pressed
        ? `Хочу на «${g.profession}» (${g.uni}). Честно, это скорее решение семьи, чем моё…`
        : `Хочу на «${g.profession}» (${g.uni}). Мне это правда интересно, это моё.`;
    },
  },
  {
    id: "warmth", text: "Как тебе удобнее общаться: официально или по-дружески?", about: "Тон общения", needs: 0,
    answer: (s) =>
      [
        "Лучше по делу и вежливо. Мне комфортнее без лишней близости.",
        "Спокойно и без пафоса. Не люблю, когда лезут в душу.",
        "Нравится, когда по-человечески, как с другом. Но без фамильярности.",
        "Мне очень важно, чтобы со мной общались тепло. Когда холодно, замыкаюсь.",
      ][Math.round(preferredWarmth(s, 30)) as 0 | 1 | 2 | 3],
  },
  { id: "hurt", text: "Что тебя задевает сильнее всего: когда игнорируют, бросают, высмеивают, обманывают или обращаются несправедливо?", about: "Чувствительная тема", needs: 1, answer: (s) => WOUNDS[woundOf(s)].voice },
  { id: "fear", text: "Чего ты боишься больше всего перед ЕНТ?", about: "Страхи", needs: 1, answer: (s) => TYPES[s.mbti].fearVoice },
];

export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id);
