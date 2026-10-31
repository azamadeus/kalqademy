import { describe, expect, it } from "vitest";
import { createStudent } from "../game/generate";
import { buildQuiz, hintFor, questionText } from "../quiz/quiz";
import { fmt } from "../game/text";
import { bytes, newCode, pointsFor, rankPlayers, scoreMsgs, trimName } from "./game";

describe("live mode", () => {
  it("scores faster correct answers higher and wrong ones zero", () => {
    expect(pointsFor(true, 0, 20000)).toBe(1000);
    expect(pointsFor(true, 20000, 20000)).toBe(500);
    expect(pointsFor(true, 5000, 20000)).toBeGreaterThan(pointsFor(true, 15000, 20000));
    expect(pointsFor(false, 0, 20000)).toBe(0);
  });
  it("makes safe codes and names", () => {
    expect(newCode()).toMatch(/^[A-HJKMNP-Z2-9]{4}$/);
    expect(trimName("  <b>Али</b>\n  ")).toBe("bАли/b");
    expect(trimName("x".repeat(40)).length).toBe(16);
  });
  it("keeps every message under the 4 KiB limit of the room channel", () => {
    const names = Array.from({ length: 300 }, (_, i) => `Игрок-${i}-имя`.slice(0, 16));
    const ids = names.map((_, i) => `peer${String(i).padStart(10, "0")}`);
    const scores = { total: Object.fromEntries(ids.map((id, i) => [id, 9000 - i])), gained: Object.fromEntries(ids.map((id) => [id, 900])), names: Object.fromEntries(ids.map((id, i) => [id, names[i]])) };
    for (const m of scoreMsgs(5, rankPlayers(scores, ids))) expect(bytes(m)).toBeLessThan(4096);
    expect(scoreMsgs(5, rankPlayers(scores, ids))).toHaveLength(3);
    for (let seed = 1; seed <= 60; seed++) {
      const s = createStudent({ seed: seed * 31, blind: false });
      for (const [i, q] of buildQuiz(s, 0, seed % 2 ? { maxChars: 130 } : {}).entries()) {
        expect(bytes({ i, title: q.event.title, text: questionText(q, s), options: q.event.options.map((o) => fmt(o.text, s)) }), `q ${seed}/${i}`).toBeLessThan(4096);
        const hint = hintFor(s, q, q.event.options.findIndex((_, k) => !q.right.includes(k)), i).map((x) => x.slice(0, 200));
        expect(bytes({ i, hint, counts: [0, 0, 0, 0] })).toBeLessThan(4096);
      }
    }
  });
});
