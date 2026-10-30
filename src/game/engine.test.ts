import { describe, expect, it } from "vitest";
import { scenarios } from "../data/scenarios";
import { studentById } from "../data/students";
import { applyOption, dominantEgo, levelOf } from "./engine";

describe("engine", () => {
  it("applies modifiers only for matching students", () => {
    const s = scenarios.find((x) => x.id === "aigerim-missed")!;
    const strict = s.options.find((o) => o.id === "a")!;
    const aigerim = studentById("aigerim"); // ENFP — has P
    const daniyar = studentById("daniyar"); // ISTJ — no P
    const a = applyOption(aigerim.start, aigerim, strict);
    const d = applyOption(daniyar.start, daniyar, strict);
    expect(a.notes.length).toBe(1);
    expect(d.notes.length).toBe(0);
    expect(a.delta.trust).toBeLessThan(d.delta.trust);
  });

  it("keeps stats within 0..100", () => {
    const s = scenarios[0];
    const student = studentById(s.studentId);
    const out = applyOption({ trust: 99, motivation: 99, stress: 1 }, student, s.options[1]);
    expect(out.stats.trust).toBeLessThanOrEqual(100);
    expect(out.stats.stress).toBeGreaterThanOrEqual(0);
  });

  it("finds dominant ego and levels", () => {
    expect(dominantEgo(studentById("zarina"))).toBe("adult");
    expect(levelOf(0)).toBe(1);
    expect(levelOf(40)).toBe(2);
  });

  it("every scenario references a real student", () => {
    for (const s of scenarios) expect(() => studentById(s.studentId)).not.toThrow();
  });
});
