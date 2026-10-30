import { describe, expect, it } from "vitest";
import { INTERVENTIONS } from "../data/workbooks";
import { act, addStudent, advance, newGame, submitPlan } from "./actions";
import { STAGES } from "./engine";
import { createStudent } from "./generate";
import { emptyPlan, interventionFit, topProblems } from "./plan";
import type { Plan, Stage } from "./types";

function bestPlan(student: ReturnType<typeof createStudent>): Plan {
  const p = emptyPlan(student);
  p.focus = topProblems(student, 3);
  p.tone = 2;
  for (const st of STAGES) {
    p.steps[st.id].interventionIds = INTERVENTIONS.filter((iv) => iv.stages.includes(st.id as Stage))
      .sort((a, b) => interventionFit(student, b, st.id) - interventionFit(student, a, st.id))
      .slice(0, 2)
      .map((x) => x.id);
  }
  p.metrics = "Пробник +5 баллов каждые две недели, стресс ниже 40";
  p.message = "Давай договоримся, что мы будем делать вместе на каждом этапе";
  p.family = "Раз в две недели короткий отчёт родителям без давления";
  return p;
}

describe("development plan", () => {
  it("scores a tailored plan far above an empty one", () => {
    let g = newGame();
    const st = createStudent({ seed: 77 });
    g = addStudent(g, st);
    g = submitPlan(g, st.id, bestPlan(st));
    const good = g.cases[st.id].planResult!.score;
    g = submitPlan(g, st.id, emptyPlan(st));
    const bad = g.cases[st.id].planResult!.score;
    expect(good).toBeGreaterThan(bad + 35);
    expect(g.curator.xp).toBeGreaterThan(0);
    expect(g.cases[st.id].planResult!.studentMessage).not.toMatch(/[{}]/);
  });

  it("a good plan improves outcomes over the same play without a plan", () => {
    const run = (withPlan: boolean) => {
      let total = 0;
      for (let i = 0; i < 40; i++) {
        let g = newGame();
        const st = createStudent({ seed: 3000 + i });
        g = addStudent(g, st);
        if (withPlan) g = submitPlan(g, st.id, bestPlan(st));
        for (let w = 0; w < 12; w++) {
          g = act(g, st.id, w % 4, 1);
          g = advance(g, st.id);
        }
        total += g.cases[st.id].finalScore!;
      }
      return total / 40;
    };
    expect(run(true)).toBeGreaterThan(run(false) + 2);
  });

  it("marks planned interventions in the turn feedback", () => {
    let g = newGame();
    const st = createStudent({ seed: 91 });
    g = addStudent(g, st);
    g = submitPlan(g, st.id, bestPlan(st));
    let planned = 0;
    for (let w = 0; w < 12; w++) {
      const c = g.cases[st.id];
      void c;
      for (let o = 0; o < 4; o++) {
        const g2 = act(g, st.id, o, 1);
        if (g2.cases[st.id].last?.planned) planned++;
      }
      g = advance(act(g, st.id, 0, 1), st.id);
    }
    expect(planned).toBeGreaterThan(0);
  });
});
