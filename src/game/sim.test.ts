import { describe, expect, it } from "vitest";
import { act, addStudent, advance, newGame } from "./actions";
import { eventById } from "../data/events";
import { createStudent } from "./generate";
import { scoreChoice } from "./engine";
import type { GameState, Tone } from "./types";

type Policy = "best" | "worst" | "fixedWarm" | "fixedCold" | "naive" | "random";

function play(seed: number, policy: Policy) {
  let g: GameState = newGame();
  const st = createStudent({ seed, blind: false });
  g = addStudent(g, st);
  for (let w = 0; w < 12; w++) {
    const c = g.cases[st.id];
    const ev = eventById(c.eventId!)!;
    let bi = 0, bt: Tone = 1, bv = policy === "worst" ? Infinity : -Infinity;
    if (policy === "naive") {
      bi = ev.options.reduce((b, o, i) => (o.fit > ev.options[b].fit ? i : b), 0);
      g = act(g, st.id, bi, 1);
      g = advance(g, st.id);
      continue;
    }
    if (policy === "random") {
      g = act(g, st.id, (w * 7 + seed) % 4, ((w + seed) % 4) as Tone);
      g = advance(g, st.id);
      continue;
    }
    ev.options.forEach((o, i) => {
      ([0, 1, 2, 3] as Tone[]).forEach((t) => {
        if (policy === "fixedWarm" && t !== 3) return;
        if (policy === "fixedCold" && t !== 0) return;
        const v = scoreChoice(st, c.trust, o, t).raw;
        if (policy === "worst" ? v < bv : v > bv) { bv = v; bi = i; bt = t; }
      });
    });
    g = act(g, st.id, bi, bt);
    g = advance(g, st.id);
  }
  const c = g.cases[st.id];
  return { score: c.finalScore!, trust: c.trust, stress: c.stress, mot: c.motivation };
}

describe("simulation balance", () => {
  it("informed play beats naive, random and bad play", () => {
    const avg = (p: Policy) => {
      const rs = Array.from({ length: 60 }, (_, i) => play(1000 + i, p));
      const m = (k: "score" | "trust" | "stress" | "mot") => Math.round(rs.reduce((a, r) => a + r[k], 0) / rs.length);
      return { score: m("score"), trust: m("trust"), stress: m("stress"), mot: m("mot") };
    };
    const res = { best: avg("best"), naive: avg("naive"), random: avg("random"), warm: avg("fixedWarm"), cold: avg("fixedCold"), worst: avg("worst") };
    expect(res.best.score).toBeGreaterThan(res.naive.score + 12);
    expect(res.naive.score).toBeGreaterThan(res.random.score + 10);
    expect(res.random.score).toBeGreaterThan(res.worst.score + 20);
    expect(res.best.score).toBeLessThanOrEqual(140);
    expect(res.best.trust).toBeGreaterThan(70);
  });
});
