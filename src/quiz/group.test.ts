import { describe, expect, it } from "vitest";
import { cardOf, cardText } from "./group";

describe("group cards", () => {
  it("are deterministic and complete", () => {
    for (const seed of [1, 7, 42, 999, 31337]) {
      const a = cardOf(seed), b = cardOf(seed);
      expect(cardText(a)).toBe(cardText(b));
      expect(a.blocks.length).toBeGreaterThanOrEqual(5);
      expect(a.situation.text.length).toBeGreaterThan(10);
      expect(a.reveal[1].lines.length).toBeGreaterThan(0);
    }
  });
});
