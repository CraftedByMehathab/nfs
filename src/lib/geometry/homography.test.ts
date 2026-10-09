import { describe, expect, it } from "vitest";
import type { Mat3, Point, Quad } from "@/types/geometry";
import {
  applyHomography,
  invert,
  isConvexQuad,
  quadToSquare,
  squareToQuad,
} from "./homography";

const UNIT_SQUARE: Quad = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

// A floor seen in perspective: narrow far edge, wide near edge, in pixels.
const FLOOR: Quad = [
  { x: 380, y: 420 },
  { x: 700, y: 430 },
  { x: 1010, y: 760 },
  { x: 40, y: 740 },
];

function expectPointClose(actual: Point, expected: Point): void {
  expect(actual.x).toBeCloseTo(expected.x, 8);
  expect(actual.y).toBeCloseTo(expected.y, 8);
}

function expectMatClose(actual: Mat3, expected: Mat3): void {
  actual.forEach((value, index) => {
    expect(value).toBeCloseTo(expected[index] ?? NaN, 10);
  });
}

describe("isConvexQuad", () => {
  it("accepts convex quads in either winding", () => {
    expect(isConvexQuad(FLOOR)).toBe(true);
    expect(isConvexQuad([FLOOR[3], FLOOR[2], FLOOR[1], FLOOR[0]])).toBe(true);
  });

  it("rejects a self-intersecting quad", () => {
    expect(isConvexQuad([FLOOR[0], FLOOR[2], FLOOR[1], FLOOR[3]])).toBe(false);
  });

  it("rejects a concave quad", () => {
    const dented: Quad = [FLOOR[0], FLOOR[1], { x: 400, y: 450 }, FLOOR[3]];
    expect(isConvexQuad(dented)).toBe(false);
  });

  it("rejects collinear and repeated corners", () => {
    const collinear: Quad = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
    ];
    const repeated: Quad = [FLOOR[0], FLOOR[0], FLOOR[2], FLOOR[3]];
    expect(isConvexQuad(collinear)).toBe(false);
    expect(isConvexQuad(repeated)).toBe(false);
  });
});

describe("squareToQuad", () => {
  it("is the identity for the unit square", () => {
    expectMatClose(squareToQuad(UNIT_SQUARE), [1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("maps the unit square corners onto the quad corners", () => {
    const m = squareToQuad(FLOOR);
    UNIT_SQUARE.forEach((corner, index) => {
      const target = FLOOR[index];
      if (!target) throw new Error("missing corner");
      expectPointClose(applyHomography(m, corner), target);
    });
  });

  it("is affine for a parallelogram", () => {
    const m = squareToQuad([
      { x: 10, y: 20 },
      { x: 110, y: 40 },
      { x: 140, y: 140 },
      { x: 40, y: 120 },
    ]);
    expectMatClose(m, [100, 30, 10, 20, 100, 20, 0, 0, 1]);
  });

  it("keeps straight lines straight: the centre maps to the diagonals' crossing", () => {
    // Diagonals of FLOOR intersect at the image of (0.5, 0.5).
    const centre = applyHomography(squareToQuad(FLOOR), { x: 0.5, y: 0.5 });
    const [p0, p1, p2, p3] = FLOOR;
    const onDiagonal = (a: Point, b: Point): number =>
      (b.x - a.x) * (centre.y - a.y) - (b.y - a.y) * (centre.x - a.x);
    expect(onDiagonal(p0, p2)).toBeCloseTo(0, 6);
    expect(onDiagonal(p1, p3)).toBeCloseTo(0, 6);
  });

  it("throws for a degenerate quad", () => {
    const flat: Quad = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ];
    expect(() => squareToQuad(flat)).toThrow(/degenerate/);
  });
});

describe("quadToSquare", () => {
  it("maps the quad corners back onto the unit square", () => {
    const m = quadToSquare(FLOOR);
    FLOOR.forEach((corner, index) => {
      const target = UNIT_SQUARE[index];
      if (!target) throw new Error("missing corner");
      expectPointClose(applyHomography(m, corner), target);
    });
  });

  it("round-trips an interior point", () => {
    const point = { x: 0.3, y: 0.8 };
    const there = applyHomography(squareToQuad(FLOOR), point);
    expectPointClose(applyHomography(quadToSquare(FLOOR), there), point);
  });
});

describe("invert", () => {
  it("throws for a singular matrix", () => {
    expect(() => invert([1, 2, 3, 2, 4, 6, 0, 0, 1])).toThrow(/not invertible/);
  });
});
