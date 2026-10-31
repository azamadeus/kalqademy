import { describe, expect, it } from "vitest";
import { createStudent } from "../game/generate";
import { TYPE_CODES } from "../data/mbti";
import { EGO_ORDER } from "../data/ego";
import { QUIZ_LENGTH, buildQuiz, hintFor } from "./quiz";
import { legendOf } from "./legend";

describe("quiz", () => {
  it("gives a full quiz with one right answer for every type and ego state", () => {
    for (const mbti of TYPE_CODES) {
      for (const dominant of EGO_ORDER) {
        const s = createStudent({ seed: 7 + mbti.charCodeAt(0) * 3, mbti, dominant, blind: false });
        const q = buildQuiz(s);
        expect(q.length).toBe(QUIZ_LENGTH);
        for (const x of q) {
          expect(x.right.length).toBeGreaterThanOrEqual(1);
          if (!x.event.serious) expect(x.right.length).toBe(1);
          expect(hintFor(s, x, (x.right[0] + 1) % x.event.options.length).length).toBeGreaterThan(0);
        }
      }
    }
  });
  it("is deterministic per student and attempt, and varies between attempts", () => {
    const s = createStudent({ seed: 42, blind: false });
    const ids = (a: number) => buildQuiz(s, a).map((q) => q.event.id).join();
    expect(ids(0)).toBe(ids(0));
    expect(ids(0)).not.toBe(ids(1));
  });
  it("different types get different right answers somewhere", () => {
    const a = createStudent({ seed: 5, mbti: "INTJ", dominant: "critical_parent", blind: false });
    const b = createStudent({ seed: 5, mbti: "ESFP", dominant: "natural_child", blind: false });
    const key = (s: typeof a) => buildQuiz(s, 0).map((q) => q.event.id + ":" + q.right[0]).join();
    expect(key(a)).not.toBe(key(b));
  });
  it("builds a legend without leftover tokens", () => {
    const s = createStudent({ seed: 9, blind: false });
    const text = legendOf(s).sections.flatMap((x) => x.lines).join(" ");
    expect(text).not.toMatch(/\{[^}]*\}/);
  });
});

import { phrasesOf } from "../data/phrases";
import { fmt } from "../game/text";
describe("phrases", () => {
  it("every type has typical phrases and no leftover tokens", () => {
    for (const mbti of TYPE_CODES) {
      const ps = phrasesOf(mbti);
      expect(ps.length).toBeGreaterThanOrEqual(5);
      for (const gender of ["f", "m"] as const) {
        const s = createStudent({ seed: 3, mbti, gender, blind: false });
        for (const p of ps) expect(fmt(p, s)).not.toMatch(/[{}|]/);
      }
    }
  });
});

import { WOUND_ORDER, WOUNDS } from "../data/wounds";
import { analysisOf } from "./quiz";
describe("wounds", () => {
  it("each sensitive theme has school behaviour and phrases, and the analysis has nine lines", () => {
    for (const w of WOUND_ORDER) {
      expect(WOUNDS[w].school.length).toBeGreaterThan(20);
      expect(WOUNDS[w].phrases.length).toBeGreaterThanOrEqual(5);
    }
    const s = createStudent({ seed: 11, blind: false });
    const lines = analysisOf(s);
    expect(lines.length).toBe(9);
    expect(lines.join(" ")).not.toMatch(/\{\w+\}/);
  });
});

import { DRIVERS, TYPE_DRIVERS } from "../data/drivers";
describe("drivers", () => {
  it("every type has main drivers and the ENFJ ones match the curator's description", () => {
    for (const mbti of TYPE_CODES) expect(TYPE_DRIVERS[mbti].drivers.length).toBeGreaterThanOrEqual(2);
    expect(TYPE_DRIVERS.ENFJ.drivers.slice(0, 2)).toEqual(["please", "try"]);
    for (const k of Object.keys(DRIVERS) as (keyof typeof DRIVERS)[]) expect(DRIVERS[k].says.length).toBeGreaterThanOrEqual(3);
  });
});

import { EVENTS } from "../data/events";
import { TAGS } from "./tags";
describe("answer features", () => {
  it("every situation has features for each of its options", () => {
    for (const e of EVENTS) {
      expect(TAGS[e.id], e.id).toBeTruthy();
      expect(TAGS[e.id].length, e.id).toBe(e.options.length);
      for (const t of TAGS[e.id]) expect(t.length).toBeGreaterThan(0);
    }
  });
});
