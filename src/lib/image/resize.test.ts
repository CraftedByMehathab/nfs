import { describe, expect, it } from "vitest";
import { fitWithin } from "./resize";

describe("fitWithin", () => {
  it("scales a landscape image so its width is the max edge", () => {
    expect(fitWithin({ width: 4032, height: 3024 }, 1024)).toEqual({
      width: 1024,
      height: 768,
    });
  });

  it("scales a portrait image so its height is the max edge", () => {
    expect(fitWithin({ width: 3024, height: 4032 }, 1024)).toEqual({
      width: 768,
      height: 1024,
    });
  });

  it("does not upscale images that already fit", () => {
    const small = { width: 800, height: 600 };
    expect(fitWithin(small, 1024)).toBe(small);
    expect(fitWithin({ width: 1024, height: 1024 }, 1024)).toEqual({
      width: 1024,
      height: 1024,
    });
  });

  it("rounds to whole pixels", () => {
    expect(fitWithin({ width: 3000, height: 1999 }, 1024)).toEqual({
      width: 1024,
      height: 682,
    });
  });

  it("keeps at least one pixel on the short edge", () => {
    expect(fitWithin({ width: 10000, height: 2 }, 1024)).toEqual({
      width: 1024,
      height: 1,
    });
  });
});
