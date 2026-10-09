import { describe, expect, it } from "vitest";
import { createRandom, pick } from "./random";

describe("createRandom", () => {
  it("repeats the same sequence for the same seed", () => {
    const first = createRandom(7);
    const second = createRandom(7);
    const a = Array.from({ length: 5 }, first);
    const b = Array.from({ length: 5 }, second);
    expect(a).toEqual(b);
  });

  it("gives different sequences for different seeds", () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it("stays within [0, 1)", () => {
    const random = createRandom(42);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("pick", () => {
  it("returns items from the list, covering all of them", () => {
    const random = createRandom(3);
    const seen = new Set(Array.from({ length: 200 }, () => pick(random, ["a", "b", "c"])));
    expect([...seen].sort()).toEqual(["a", "b", "c"]);
  });
});
