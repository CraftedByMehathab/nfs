import { describe, expect, it } from "vitest";
import type { Point, Quad } from "@/types/geometry";
import {
  convexHull,
  fitQuadToMask,
  largestRegion,
  orderCorners,
  reduceToFourCorners,
  sharpestCornerAngle,
  trapezoidOver,
} from "./fitQuad";

const SIZE = 64;

/** Builds a SIZE x SIZE mask that is on wherever `inside` says so (pixel centres, 0..1). */
function maskOf(inside: (x: number, y: number) => boolean): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inside((x + 0.5) / SIZE, (y + 0.5) / SIZE)) mask[y * SIZE + x] = 255;
    }
  }
  return mask;
}

function insideQuad(quad: Quad, x: number, y: number): boolean {
  return quad.every((corner, i) => {
    const next = quad[(i + 1) % 4];
    if (!next) return false;
    return (next.x - corner.x) * (y - corner.y) - (next.y - corner.y) * (x - corner.x) >= 0;
  });
}

function expectQuadClose(actual: Quad | null, expected: Quad, tolerance: number): void {
  expect(actual).not.toBeNull();
  actual?.forEach((corner, i) => {
    const target = expected[i];
    expect(Math.abs(corner.x - (target?.x ?? NaN))).toBeLessThan(tolerance);
    expect(Math.abs(corner.y - (target?.y ?? NaN))).toBeLessThan(tolerance);
  });
}

// A floor seen in perspective: narrow at the back, wide at the front.
const TRAPEZOID: Quad = [
  { x: 0.35, y: 0.4 },
  { x: 0.7, y: 0.45 },
  { x: 0.95, y: 0.9 },
  { x: 0.1, y: 0.85 },
];

describe("largestRegion", () => {
  it("keeps the biggest blob and drops smaller ones", () => {
    // 4x3: a blob of three on the left, a single pixel on the right.
    const mask = [
      255, 255, 0, 0,
      255, 0, 0, 255,
      0, 0, 0, 0,
    ];
    expect([...largestRegion(mask, 4, 3)]).toEqual([
      1, 1, 0, 0,
      1, 0, 0, 0,
      0, 0, 0, 0,
    ]);
  });

  it("does not join pixels across the left and right borders", () => {
    // The last pixel of row 0 and the first of row 1 are neighbours in memory only.
    const mask = [0, 0, 255, 255, 0, 0];
    const region = largestRegion(mask, 3, 2);
    expect((region[2] ?? 0) + (region[3] ?? 0)).toBe(1);
  });

  it("is empty for an empty mask", () => {
    expect([...largestRegion([0, 0, 0, 0], 2, 2)]).toEqual([0, 0, 0, 0]);
  });
});

describe("convexHull", () => {
  it("drops interior and collinear points", () => {
    const hull = convexHull([
      { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 },
      { x: 4, y: 4 }, { x: 0, y: 4 }, { x: 2, y: 2 },
    ]);
    expect(hull).toHaveLength(4);
    expect(hull).toEqual(expect.arrayContaining([
      { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 },
    ]));
  });
});

describe("reduceToFourCorners", () => {
  it("rebuilds the sharp corners of a square whose corners were cut off", () => {
    const octagon: Point[] = [
      { x: 1, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 1 }, { x: 10, y: 9 },
      { x: 9, y: 10 }, { x: 1, y: 10 }, { x: 0, y: 9 }, { x: 0, y: 1 },
    ];
    const corners = reduceToFourCorners(octagon);
    expect(corners).toHaveLength(4);
    for (const expected of [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]) {
      expect(corners.some((c) => Math.hypot(c.x - expected.x, c.y - expected.y) < 1e-9)).toBe(true);
    }
  });
});

describe("orderCorners", () => {
  it("returns top-left, top-right, bottom-right, bottom-left from any start or direction", () => {
    const [tl, tr, br, bl] = TRAPEZOID;
    expect(orderCorners([br, bl, tl, tr])).toEqual(TRAPEZOID);
    expect(orderCorners([tr, tl, bl, br])).toEqual(TRAPEZOID);
  });
});

describe("fitQuadToMask", () => {
  it("recovers the corners of a trapezoid", () => {
    const mask = maskOf((x, y) => insideQuad(TRAPEZOID, x, y));
    expectQuadClose(fitQuadToMask(mask, SIZE, SIZE, 1), TRAPEZOID, 0.04);
  });

  it("ignores a stray blob elsewhere in the photo", () => {
    const mask = maskOf((x, y) => insideQuad(TRAPEZOID, x, y) || (x < 0.08 && y < 0.08));
    expectQuadClose(fitQuadToMask(mask, SIZE, SIZE, 1), TRAPEZOID, 0.04);
  });

  it("handles a floor that runs off the bottom of the photo", () => {
    const cut: Quad = [
      { x: 0.3, y: 0.5 },
      { x: 0.7, y: 0.5 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const mask = maskOf((x, y) => insideQuad(cut, x, y));
    expectQuadClose(fitQuadToMask(mask, SIZE, SIZE, 1), cut, 0.04);
  });

  it("returns null when there is no region", () => {
    expect(fitQuadToMask(new Uint8ClampedArray(SIZE * SIZE), SIZE, SIZE, 1)).toBeNull();
  });

  it("falls back to a plain trapezoid when the floor is seen at an angle", () => {
    // A room corner photographed diagonally: the visible floor has a very sharp corner.
    const angled: Quad = [
      { x: 0.5, y: 0.6 },
      { x: 1, y: 0.8 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const mask = maskOf((x, y) => insideQuad(angled, x, y));
    const fallback: Quad = [
      { x: 0.25, y: 0.6 },
      { x: 0.75, y: 0.6 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    expectQuadClose(fitQuadToMask(mask, SIZE, SIZE, 4 / 3), fallback, 0.04);
  });
});

describe("sharpestCornerAngle", () => {
  it("is 90 degrees for a rectangle, whatever the photo's shape", () => {
    const rectangle: Quad = [
      { x: 0.1, y: 0.2 },
      { x: 0.9, y: 0.2 },
      { x: 0.9, y: 0.8 },
      { x: 0.1, y: 0.8 },
    ];
    expect(sharpestCornerAngle(rectangle, 1)).toBeCloseTo(90, 6);
    expect(sharpestCornerAngle(rectangle, 16 / 9)).toBeCloseTo(90, 6);
  });

  it("accounts for the photo's aspect ratio", () => {
    const quad: Quad = [
      { x: 0.5, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    // In a square photo the bottom-left corner is atan(1 / 0.5); a wide photo flattens it.
    expect(sharpestCornerAngle(quad, 1)).toBeCloseTo(63.43, 1);
    expect(sharpestCornerAngle(quad, 2)).toBeCloseTo(45, 6);
  });
});

describe("trapezoidOver", () => {
  it("spans the points, full width at the bottom and half width at the top", () => {
    expect(trapezoidOver([{ x: 0.2, y: 0.4 }, { x: 1, y: 0.6 }, { x: 0.6, y: 1 }])).toEqual([
      { x: 0.4, y: 0.4 },
      { x: 0.8, y: 0.4 },
      { x: 1, y: 1 },
      { x: 0.2, y: 1 },
    ]);
  });

  it("is null when the points have no width or height", () => {
    expect(trapezoidOver([{ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.9 }])).toBeNull();
  });
});
