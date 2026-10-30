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
          expect(x.right.length).toBe(1);
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
