import { describe, expect, it } from "vitest";
import { averageMaskedLuminance, srgbToLinear } from "./luminance";

const WHITE = [255, 255, 255, 255];
const BLACK = [0, 0, 0, 255];
const GREY = [128, 128, 128, 255];
const ON = [255, 255, 255, 255];
const OFF = [0, 0, 0, 255];
const HALF = [128, 128, 128, 255];

describe("srgbToLinear", () => {
  it("maps the ends of the range to 0 and 1", () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(255)).toBeCloseTo(1, 10);
  });

  it("maps mid grey to about 21.6% linear light", () => {
    expect(srgbToLinear(128)).toBeCloseTo(0.2158, 3);
  });
});

describe("averageMaskedLuminance", () => {
  it("averages only the pixels the mask covers", () => {
    const photo = [...WHITE, ...BLACK, ...GREY];
    expect(averageMaskedLuminance(photo, [...ON, ...OFF, ...OFF])).toBeCloseTo(1, 6);
    expect(averageMaskedLuminance(photo, [...OFF, ...ON, ...OFF])).toBe(0);
    expect(averageMaskedLuminance(photo, [...ON, ...ON, ...OFF])).toBeCloseTo(0.5, 6);
  });

  it("weights partly covered pixels by their coverage", () => {
    const photo = [...WHITE, ...BLACK];
    const half = 128 / 255;
    expect(averageMaskedLuminance(photo, [...HALF, ...ON])).toBeCloseTo(half / (half + 1), 6);
  });

  it("weights green most and blue least, as the eye does", () => {
    const green = averageMaskedLuminance([0, 255, 0, 255], ON);
    const red = averageMaskedLuminance([255, 0, 0, 255], ON);
    const blue = averageMaskedLuminance([0, 0, 255, 255], ON);
    expect(green).toBeGreaterThan(red);
    expect(red).toBeGreaterThan(blue);
    expect(green + red + blue).toBeCloseTo(1, 6);
  });

  it("is zero when the mask is empty", () => {
    expect(averageMaskedLuminance([...WHITE, ...GREY], [...OFF, ...OFF])).toBe(0);
  });
});
