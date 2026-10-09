import { describe, expect, it } from "vitest";
import { isConvexQuad } from "./homography";
import { DEFAULT_QUAD, moveCorner } from "./quad";

describe("DEFAULT_QUAD", () => {
  it("is a valid convex selection", () => {
    expect(isConvexQuad(DEFAULT_QUAD)).toBe(true);
  });
});

describe("moveCorner", () => {
  it("moves only the chosen corner and leaves the original untouched", () => {
    const moved = moveCorner(DEFAULT_QUAD, 2, { x: 0.8, y: 0.9 });
    expect(moved[2]).toEqual({ x: 0.8, y: 0.9 });
    expect(moved[0]).toBe(DEFAULT_QUAD[0]);
    expect(moved[1]).toBe(DEFAULT_QUAD[1]);
    expect(moved[3]).toBe(DEFAULT_QUAD[3]);
    expect(DEFAULT_QUAD[2]).toEqual({ x: 0.95, y: 0.95 });
  });

  it("clamps the corner to the image bounds", () => {
    expect(moveCorner(DEFAULT_QUAD, 0, { x: -0.2, y: 1.4 })[0]).toEqual({
      x: 0,
      y: 1,
    });
  });
});
