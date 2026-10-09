import { describe, expect, it } from "vitest";
import { summariseLogits } from "./logits";

const LABELS = ["wall", "floor", "ceiling"];
const labelOf = (index: number) => LABELS[index] ?? "unknown";

// Three classes over four positions, laid out class by class.
const LOGITS = [
  // wall
  5, 0, 0, 1,
  // floor
  0, 5, 9, 1,
  // ceiling
  0, 0, 0, 1,
];

describe("summariseLogits", () => {
  it("gives a high probability where the target class wins and a low one elsewhere", () => {
    const { probability } = summariseLogits(LOGITS, 3, 1, labelOf);
    expect(probability[0]).toBeLessThan(5);
    expect(probability[1]).toBeGreaterThan(245);
    expect(probability[2]).toBe(255);
  });

  it("splits probability evenly when every class scores the same", () => {
    const { probability } = summariseLogits(LOGITS, 3, 1, labelOf);
    expect(probability[3]).toBe(85);
  });

  it("lists the winning classes by share, largest first", () => {
    const { classes } = summariseLogits(LOGITS, 3, 1, labelOf);
    // The tie at the last position goes to the first class.
    expect(classes).toEqual([
      { label: "wall", share: 0.5 },
      { label: "floor", share: 0.5 },
    ]);
  });

  it("does not overflow on very large scores", () => {
    const { probability } = summariseLogits([1000, 0, 0, 1000], 2, 0, labelOf);
    expect([...probability]).toEqual([255, 0]);
  });
});
