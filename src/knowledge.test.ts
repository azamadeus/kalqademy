import { describe, expect, it } from "vitest";
import bourbeau from "../knowledge/bourbeau.json";
import ways from "../knowledge/maxwell_25_ways.json";
import laws from "../knowledge/maxwell_21_laws.json";
import leader from "../knowledge/maxwell_leader_2.json";
import { WOUND_ORDER } from "./data/wounds";

describe("knowledge base", () => {
  it("covers all five wounds and every reference list", () => {
    const b = bourbeau;
    expect(b.wounds.map((w: { our_key: string }) => w.our_key).sort()).toEqual([...WOUND_ORDER].sort());
    for (const w of b.wounds) {
      expect(w.behaviour.length).toBeGreaterThanOrEqual(6);
      expect(w.speech_markers.length).toBeGreaterThanOrEqual(5);
      expect(w.healed.length).toBeGreaterThanOrEqual(3);
    }
    expect(ways.ways).toHaveLength(25);
    expect(laws.laws).toHaveLength(21);
    expect(leader.chapters).toHaveLength(10);
  });
  it("does not store body-shape descriptions", () => {
    const text = JSON.stringify(bourbeau);
    expect(text).not.toMatch(/телосложен|худое тело|пухлость|ягодиц/i);
  });
});
