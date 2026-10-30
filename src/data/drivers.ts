import { LANG } from "../i18n";

export type DriverKey = "perfect" | "strong" | "please" | "try" | "hurry";
export type BanKey = "feel" | "self" | "child" | "weak" | "mistake" | "trust" | "close" | "stand" | "conflict" | "selfish";
type Pair = [string, string];

export interface Driver {
  name: Pair;
  /** The inner command the student obeys. */
  slogan: Pair;
  /** What it looks like in a school student. */
  shows: Pair;
  /** Typical phrases (Russian, Kazakh); gender forms use {male|female}. */
  says: Pair[];
  /** What helps: the "permission" the curator can give. */
  permission: Pair;
}

/** The five drivers of transactional analysis (as in the ALQA driver workbook). */
export const DRIVERS: Record<DriverKey, Driver> = {
  perfect: {
    name: ["Будь совершенным", "Мінсіз бол"],
    slogan: ["Всё должно быть идеально, ошибаться нельзя", "Бәрі мінсіз болуы керек, қателесуге болмайды"],
    shows: ["Перфекционизм, самокритика, откладывает сдачу, пока не станет «идеально»", "Перфекционизм, өзін-өзі сынау, «мінсіз» болғанша тапсырманы кейінге қалдыру"],
    says: [["Ещё не идеально", "Әлі мінсіз емес"], ["Я должен{|на} сделать без ошибок", "Мен қатесіз істеуім керек"], ["Если не на 100, то зачем", "Жүз болмаса, не керек"]],
    permission: ["Можно быть несовершенным, ошибки это часть учёбы", "Кемшілікке рұқсат: қателік оқудың бір бөлігі"],
  },
  strong: {
    name: ["Будь сильным", "Мықты бол"],
    slogan: ["Не показывай слабость и не проси помощи", "Әлсіздікті көрсетпе, көмек сұрама"],
    shows: ["Не просит помощи, скрывает усталость и страх, говорит ровным голосом «всё нормально»", "Көмек сұрамайды, шаршағанын мен қорқынышын жасырады, «бәрі жақсы» дейді"],
    says: [["Я сам{|а} справлюсь", "Мен өзім шешемін"], ["Мне помощь не нужна", "Маған көмек керек емес"], ["Всё нормально", "Бәрі жақсы"]],
    permission: ["Можно просить для себя и чувствовать", "Өзіңе сұрауға және сезінуге болады"],
  },
  please: {
    name: ["Радуй других", "Басқаларды қуандыр"],
    slogan: ["Угождай, чтобы тебя приняли и не бросили", "Ұнат, сонда сені қабылдайды және тастамайды"],
    shows: ["Угождает, боится сказать «нет», ищет одобрения, берёт на себя чужое", "Жағынады, «жоқ» айтуға қорқады, мақұлдауды іздейді, өзгенің жұмысын алады"],
    says: [["Как вам лучше?", "Сізге қалай жақсы?"], ["Как скажете", "Қалай айтсаңыз солай"], ["Вы довольны?", "Көңіліңіз толды ма?"]],
    permission: ["Можно говорить «нет», понимать и выражать свои желания", "«Жоқ» деуге, өз тілектерін түсініп, білдіруге болады"],
  },
  try: {
    name: ["Старайся", "Тырыс"],
    slogan: ["Усилие важнее результата: «пытаюсь», но не доводит", "Күш салу нәтижеден маңызды: «тырысамын», бірақ аяғына жеткізбейді"],
    shows: ["Много усилий и стресса, зажатость, «стараюсь», но результат не фиксирует и не радуется ему", "Күш көп, стресс, қысылу, «тырысамын», бірақ нәтижені көрмейді және қуанбайды"],
    says: [["Я стараюсь", "Тырысамын"], ["Я пытаюсь, но трудно", "Тырысып жатырмын, бірақ қиын"], ["Я ещё не {готов|готова}", "Дайын емеспін"]],
    permission: ["Можно делать, а не пытаться: замечать и признавать свои достижения", "Тырысып қана қоймай, істеуге болады: жетістігіңді байқап, мойында"],
  },
  hurry: {
    name: ["Спеши", "Асық"],
    slogan: ["Быстрее, времени нет", "Тезірек, уақыт жоқ"],
    shows: ["Торопится, делает впопыхах, ошибается по невнимательности, всё время «нет времени»", "Асығады, абайсыз қателеседі, үнемі «уақыт жоқ» дейді"],
    says: [["Быстрее, быстрее", "Тезірек, тезірек"], ["Нет времени думать", "Ойлануға уақыт жоқ"], ["Давайте уже кончать", "Тезірек аяқтайық"]],
    permission: ["Можно не спешить: подумать и быть здесь и сейчас", "Асықпай, ойланып, осы сәтте болуға болады"],
  },
};

export const BANS: Record<BanKey, Pair> = {
  feel: ["Не чувствуй", "Сезінбе"],
  self: ["Не будь собой", "Өзің болма"],
  child: ["Не будь ребёнком", "Бала болма"],
  weak: ["Не будь слабым", "Әлсіз болма"],
  mistake: ["Не ошибайся", "Қателеспе"],
  trust: ["Не доверяй", "Сенім артпа"],
  close: ["Не будь близким", "Жақын болма"],
  stand: ["Не выделяйся", "Тым ерекшеленбе"],
  conflict: ["Не конфликтуй", "Қақтығыспа"],
  selfish: ["Не будь эгоистом", "Эгоист болма"],
};

/**
 * Typical drivers and prohibitions per type: read from the "Драйверлер мен тыйымдар" pages of the ALQA
 * type PDFs (the first driver is the main one). ENFJ follows the curator's description
 * ("радуй других", "старайся"). A training model, not a measurement.
 */
export const TYPE_DRIVERS: Record<string, { drivers: DriverKey[]; bans: BanKey[] }> = {
  ENFJ: { drivers: ["please", "try", "perfect"], bans: ["feel", "self"] },
  ENFP: { drivers: ["perfect", "please"], bans: ["child"] },
  ENTJ: { drivers: ["perfect", "strong"], bans: ["weak", "feel"] },
  ENTP: { drivers: ["strong", "perfect"], bans: ["feel", "close"] },
  ESFJ: { drivers: ["please", "strong"], bans: ["selfish", "weak", "conflict"] },
  ESFP: { drivers: ["perfect", "please", "strong"], bans: ["mistake", "weak", "trust"] },
  ESTJ: { drivers: ["perfect", "strong", "please"], bans: ["mistake", "child"] },
  ESTP: { drivers: ["strong", "try", "please"], bans: ["weak", "mistake"] },
  INFJ: { drivers: ["perfect", "strong", "please"], bans: ["mistake", "weak", "feel"] },
  INFP: { drivers: ["perfect", "please"], bans: ["mistake", "weak", "stand"] },
  INTJ: { drivers: ["perfect", "strong"], bans: ["weak", "feel"] },
  INTP: { drivers: ["perfect", "hurry"], bans: ["feel", "mistake"] },
  ISFJ: { drivers: ["please", "perfect", "strong"], bans: ["feel", "self", "weak"] },
  ISFP: { drivers: ["perfect", "please"], bans: ["child"] },
  ISTJ: { drivers: ["perfect", "try", "strong"], bans: ["weak", "mistake"] },
  ISTP: { drivers: ["perfect", "strong"], bans: ["feel", "close"] },
};

export const pick = (p: Pair) => (LANG === "kk" ? p[1] : p[0]);
export const driversOf = (mbti: string) => TYPE_DRIVERS[mbti] ?? { drivers: [], bans: [] };
