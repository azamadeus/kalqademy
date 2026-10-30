import type { WoundKey } from "../data/wounds";

export type Letter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type Group = "analyst" | "diplomat" | "sentinel" | "explorer";
export type EgoKey =
  | "caring_parent"
  | "critical_parent"
  | "adult"
  | "adapted_child"
  | "natural_child";
export type Tactic = "listen" | "plan" | "goal" | "challenge" | "space" | "family" | "play";
export type Tone = 0 | 1 | 2 | 3;
export type SkillKey =
  | "empathy"
  | "structure"
  | "motivation"
  | "boundaries"
  | "family"
  | "diagnostics";
export type Stage = "meet" | "diagnose" | "trust" | "work" | "exam";
export type Karpman = "rescuer" | "persecutor" | "victim";
export type Quality = "great" | "good" | "meh" | "bad";

export type ProblemKey =
  | "motivation"
  | "anxiety"
  | "perfectionism"
  | "family"
  | "course"
  | "burnout"
  | "comparison"
  | "goal"
  | "boundaries"
  | "discipline"
  | "money"
  | "social";

export interface Look {
  skin: number;
  hair: number;
  hairColor: number;
  accessory: number;
}

export interface Student {
  id: string;
  name: string;
  gender: "f" | "m";
  age: number;
  city: string;
  mbti: string;
  ego: Record<EgoKey, number>;
  familyId: string;
  courseId: string;
  goalId: string;
  mock: number;
  seed: number;
  look: Look;
  /** Hidden profile: MBTI/ego are not shown until discovered. */
  blind: boolean;
  /** Sensitive theme (behavioural model); derived from the profile when not set. */
  wound?: WoundKey;
}

export interface Msg {
  id: number;
  from: "student" | "curator" | "system";
  text: string;
  tone?: Tone;
}

export interface Hypothesis {
  letters: Partial<Record<"EI" | "SN" | "TF" | "JP", Letter>>;
  ego?: EgoKey;
}

export interface Judgement {
  situation: boolean;
  style: boolean;
  tone: boolean;
}

export interface LastTurn {
  eventId: string;
  tactic: Tactic;
  tone: Tone;
  quality: Quality;
  judge: Judgement;
  dTrust: number;
  dMotivation: number;
  dStress: number;
  dKnowledge: number;
  intrusive: boolean;
  tooCold: boolean;
  why: string[];
  /** Title of the planned intervention that covered this situation, if any. */
  planned?: string | null;
}

export interface PlanStep {
  interventionIds: string[];
  note: string;
}

export interface Plan {
  goalScore: number;
  focus: ProblemKey[];
  tone: Tone | null;
  steps: Record<Stage, PlanStep>;
  metrics: string;
  message: string;
  family: string;
}

export interface PlanResult {
  at: number;
  score: number;
  parts: { goal: number; focus: number; fit: number; complete: number; tone: number };
  studentMessage: string;
  expert: string[];
  xp: number;
}

export interface CaseState {
  studentId: string;
  week: number;
  trust: number;
  motivation: number;
  stress: number;
  knowledge: number;
  revealed: string[];
  asked: string[];
  eventId: string | null;
  acted: boolean;
  doneEvents: string[];
  log: Msg[];
  questionsLeft: number;
  hypothesis: Hypothesis;
  last: LastTurn | null;
  tones: number[];
  finished: boolean;
  finalScore: number | null;
  reports: ReportResult[];
  msgSeq: number;
  plan?: Plan | null;
  planResult?: PlanResult | null;
}

export interface Curator {
  name: string;
  xp: number;
  skills: Record<SkillKey, number>;
  casesFinished: number;
}

export interface ReportInput {
  letters: Partial<Record<"EI" | "SN" | "TF" | "JP", Letter>>;
  ego: EgoKey | null;
  wound?: WoundKey | null;
  tone: Tone | null;
  tactics: Tactic[];
  note: string;
}

export interface ReportResult {
  at: number;
  week: number;
  input: ReportInput;
  score: number;
  lettersCorrect: number;
  egoCorrect: boolean;
  woundCorrect?: boolean;
  toneScore: number;
  tacticsHit: number;
  studentMessage: string;
  expert: string[];
  xp: number;
}

export interface GameState {
  version: number;
  curator: Curator;
  students: Student[];
  cases: Record<string, CaseState>;
  achievements: string[];
  seq: number;
}
