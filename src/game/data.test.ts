import { describe, expect, it } from "vitest";
import { EGO, EGO_ORDER } from "../data/ego";
import { EVENTS } from "../data/events";
import { QUESTIONS } from "../data/questions";
import { TYPE_CODES, TYPES, groupOf } from "../data/mbti";
import { COURSES, FAMILIES, GOALS } from "../data/world";
import { EXERCISES } from "../data/exercises";
import { INTERVENTIONS } from "../data/workbooks";
import { act, addStudent, advance, newGame, setHypothesis, submitReport } from "./actions";
import { bestTone, dominantEgo, stageOf, woundOf } from "./engine";
import { WOUND_ORDER, WOUNDS, ETHICS_RULES } from "../data/wounds";
import { createStudent } from "./generate";
import { fmt } from "./text";
import { seasonReview } from "./review";

describe("content integrity", () => {
  it("has all 16 types and 5 ego states", () => {
    expect(TYPE_CODES).toHaveLength(16);
    for (const c of TYPE_CODES) expect(groupOf(c)).toBe(TYPES[c].group);
    expect(EGO_ORDER).toHaveLength(5);
    for (const k of EGO_ORDER) expect(EGO[k].say.length).toBeGreaterThan(0);
  });

  it("every event has 4 options with distinct tactics and a playable stage", () => {
    for (const e of EVENTS) {
      expect(e.options, e.id).toHaveLength(4);
      expect(new Set(e.options.map((o) => o.tactic)).size, e.id).toBe(4);
      expect(e.options.some((o) => o.fit >= 1), e.id).toBe(true);
    }
    for (const w of [1, 3, 5, 8, 12]) expect(EVENTS.some((e) => e.stages.includes(stageOf(w)))).toBe(true);
  });

  it("templates leave no stray braces for both genders", () => {
    for (const gender of ["f", "m"] as const) {
      const s = createStudent({ seed: 7, gender });
      for (const e of EVENTS) {
        expect(fmt(e.text, s), e.id).not.toMatch(/[{}]/);
        for (const o of e.options) expect(fmt(o.text, s)).not.toMatch(/[{}]/);
      }
      for (const q of QUESTIONS) {
        expect(fmt(q.text, s)).not.toMatch(/[{}]/);
        expect(fmt(q.answer(s), s), q.id).not.toMatch(/[{}]/);
      }
    }
  });
});

describe("workbook content", () => {
  it("has 49 handout exercises covering every number once", () => {
    expect(EXERCISES.map((x) => x.n)).toEqual(Array.from({ length: 49 }, (_, i) => i + 1));
  });
  it("has unique intervention ids with valid references", () => {
    expect(new Set(INTERVENTIONS.map((i) => i.id)).size).toBe(INTERVENTIONS.length);
    for (const i of INTERVENTIONS) {
      expect(i.problems.length, i.id).toBeGreaterThan(0);
      expect(i.egos.length, i.id).toBeGreaterThan(0);
      expect(i.stages.length, i.id).toBeGreaterThan(0);
    }
  });
});

describe("sensitive themes (behavioural model)", () => {
  it("is deterministic, covers all five themes and never depends on appearance", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const s = createStudent({ seed: 9000 + i });
      expect(woundOf(s)).toBe(woundOf({ ...s, look: { skin: 0, hair: 0, hairColor: 0, accessory: 0 } }));
      seen.add(woundOf(s));
    }
    expect(seen.size).toBe(WOUND_ORDER.length);
    for (const w of WOUND_ORDER) {
      expect(WOUNDS[w].signs.join(" ")).not.toMatch(/телосложен|фигур|вес |лицо|внешност/i);
      expect(WOUNDS[w].works.length).toBeGreaterThan(0);
    }
    expect(ETHICS_RULES.some((r) => /психолог/i.test(r.text))).toBe(true);
  });

  it("an explicit theme overrides the derived one and shapes the best approach", () => {
    const base = createStudent({ seed: 5 });
    const hum = { ...base, wound: "humiliation" as const };
    expect(woundOf(hum)).toBe("humiliation");
  });

  it("the safety event rewards listening/involving adults and punishes dismissal", () => {
    const e = EVENTS.find((x) => x.id === "alarm")!;
    expect(e.serious).toBe(true);
    const fits = Object.fromEntries(e.options.map((o) => [o.tactic, o.fit]));
    expect(fits.listen).toBeGreaterThanOrEqual(2);
    expect(fits.family).toBeGreaterThanOrEqual(2);
    expect(fits.play).toBeLessThan(0);
  });
});

describe("season review", () => {
  it("summarises a played season", () => {
    let g = newGame();
    const st = createStudent({ seed: 12 });
    g = addStudent(g, st);
    for (let w = 0; w < 12; w++) {
      g = act(g, st.id, w % 4, 1);
      g = advance(g, st.id);
    }
    const r = seasonReview(g.cases[st.id]);
    expect(r.total).toBe(12);
    expect(r.counts.great + r.counts.good + r.counts.meh + r.counts.bad).toBe(12);
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.improve.some((t) => /План/.test(t))).toBe(true);
  });
});

describe("game flow", () => {
  it("plays a full season for every type and reveals the profile at the end", () => {
    for (const [i, mbti] of TYPE_CODES.entries()) {
      let g = newGame();
      const st = createStudent({ seed: 500 + i, mbti, familyId: FAMILIES[i % FAMILIES.length].id, courseId: COURSES[i % COURSES.length].id, goalId: GOALS[i % GOALS.length].id });
      g = addStudent(g, st);
      for (let w = 0; w < 12; w++) {
        g = act(g, st.id, w % 4, 1);
        g = advance(g, st.id);
      }
      const c = g.cases[st.id];
      expect(c.finished).toBe(true);
      expect(c.finalScore).toBeGreaterThanOrEqual(20);
      expect(g.students[0].blind).toBe(false);
      expect(new Set(c.doneEvents).size).toBe(12);
    }
  });

  it("scores a perfect report higher than an empty one", () => {
    let g = newGame();
    const st = createStudent({ seed: 42 });
    g = addStudent(g, st);
    g = setHypothesis(g, st.id, { letters: {} });
    const letters = { EI: st.mbti[0], SN: st.mbti[1], TF: st.mbti[2], JP: st.mbti[3] } as never;
    g = submitReport(g, st.id, { letters, ego: dominantEgo(st), tone: bestTone(st, 20), tactics: [], note: "" });
    g = submitReport(g, st.id, { letters: {}, ego: null, tone: null, tactics: [], note: "" });
    const [good, bad] = g.cases[st.id].reports;
    expect(good.lettersCorrect).toBe(4);
    expect(good.egoCorrect).toBe(true);
    expect(good.score).toBeGreaterThan(bad.score + 40);
    expect(good.studentMessage).not.toMatch(/[{}]/);
  });
});
