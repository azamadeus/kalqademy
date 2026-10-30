import { describe, expect, it } from "vitest";
import { EGO, EGO_ORDER } from "../data/ego";
import { EVENTS } from "../data/events";
import { QUESTIONS } from "../data/questions";
import { TYPE_CODES, TYPES, groupOf } from "../data/mbti";
import { COURSES, FAMILIES, GOALS } from "../data/world";
import { act, addStudent, advance, newGame, setHypothesis, submitReport } from "./actions";
import { bestTone, dominantEgo, stageOf } from "./engine";
import { createStudent } from "./generate";
import { fmt } from "./text";

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
