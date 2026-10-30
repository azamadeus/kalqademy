export type Letter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type Ego = "parent" | "adult" | "child";
export type Skill = "empathy" | "structure" | "motivation" | "family";

export interface Stats {
  trust: number;
  motivation: number;
  stress: number;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  mbti: string;
  ego: Record<Ego, number>;
  goal: string;
  bio: string;
  start: Stats;
}

/** Extra effect applied only when the student matches the condition. */
export interface Modifier {
  letter?: Letter;
  ego?: Ego;
  delta: Partial<Stats>;
  note: string;
}

export interface Option {
  id: string;
  text: string;
  delta: Partial<Stats>;
  xp: Partial<Record<Skill, number>>;
  feedback: string;
  modifiers?: Modifier[];
}

export interface Scenario {
  id: string;
  studentId: string;
  title: string;
  text: string;
  options: Option[];
}

export interface Curator {
  xp: number;
  skills: Record<Skill, number>;
}

export type Rating = "good" | "ok" | "bad";

export interface Outcome {
  stats: Stats;
  delta: Stats;
  notes: string[];
  xpGain: number;
  skillGain: Partial<Record<Skill, number>>;
  rating: Rating;
}
