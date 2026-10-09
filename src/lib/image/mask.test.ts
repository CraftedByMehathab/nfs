import { describe, expect, it } from "vitest";
import { maskCoverage, maskToRgba, sharpenEdge } from "./mask";

describe("maskCoverage", () => {
  it("is the share of pixels that are on", () => {
    expect(maskCoverage(new Uint8ClampedArray([255, 255, 0, 0]))).toBe(0.5);
    expect(maskCoverage(new Uint8ClampedArray([0, 0, 0]))).toBe(0);
    expect(maskCoverage(new Uint8ClampedArray([255]))).toBe(1);
  });

  it("counts a pixel as on only above the midpoint", () => {
    expect(maskCoverage(new Uint8ClampedArray([127, 128]))).toBe(0.5);
  });

  it("is zero for an empty mask", () => {
    expect(maskCoverage(new Uint8ClampedArray(0))).toBe(0);
  });
});

describe("maskToRgba", () => {
  it("writes each value to red, green and blue with full alpha", () => {
    expect([...maskToRgba(new Uint8ClampedArray([255, 0, 40]))]).toEqual([
      255, 255, 255, 255,
      0, 0, 0, 255,
      40, 40, 40, 255,
    ]);
  });
});

describe("sharpenEdge", () => {
  it("pushes uncertain values to fully off or fully on", () => {
    expect(sharpenEdge(0)).toBe(0);
    expect(sharpenEdge(80)).toBe(0);
    expect(sharpenEdge(175)).toBe(255);
    expect(sharpenEdge(255)).toBe(255);
  });

  it("keeps the midpoint in the middle and rises steadily around it", () => {
    expect(sharpenEdge(127.5)).toBe(128);
    expect(sharpenEdge(110)).toBeLessThan(sharpenEdge(127.5));
    expect(sharpenEdge(145)).toBeGreaterThan(sharpenEdge(127.5));
  });
});
