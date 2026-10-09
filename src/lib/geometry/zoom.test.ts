import { describe, expect, it } from "vitest";
import { clampZoom, scrollAfterZoom, stepZoom } from "./zoom";

describe("clampZoom", () => {
  it("keeps zoom between 1 and 4", () => {
    expect(clampZoom(0.3)).toBe(1);
    expect(clampZoom(2.2)).toBe(2.2);
    expect(clampZoom(9)).toBe(4);
  });
});

describe("stepZoom", () => {
  it("walks up and down the preset levels", () => {
    expect(stepZoom(1, "in")).toBe(1.5);
    expect(stepZoom(1.5, "in")).toBe(2);
    expect(stepZoom(3, "out")).toBe(2);
  });

  it("moves to the nearest preset from an in-between level", () => {
    expect(stepZoom(1.7, "in")).toBe(2);
    expect(stepZoom(1.7, "out")).toBe(1.5);
  });

  it("stops at the limits", () => {
    expect(stepZoom(4, "in")).toBe(4);
    expect(stepZoom(1, "out")).toBe(1);
  });
});

describe("scrollAfterZoom", () => {
  it("keeps the picture point under the anchor in place", () => {
    // 400px viewport, 10px padding, anchored at its centre, zooming 1 -> 2.
    const scroll = scrollAfterZoom(0, 200, 10, 2);
    // The point 190px into the picture is now at 380px, and must still sit at 200px.
    expect(scroll).toBe(380 + 10 - 200);
  });

  it("is unchanged when the zoom does not change", () => {
    expect(scrollAfterZoom(123, 50, 10, 1)).toBe(123);
  });

  it("zooming in then out by the same amount returns to the start", () => {
    const zoomedIn = scrollAfterZoom(40, 120, 12, 3);
    expect(scrollAfterZoom(zoomedIn, 120, 12, 1 / 3)).toBeCloseTo(40, 9);
  });
});
