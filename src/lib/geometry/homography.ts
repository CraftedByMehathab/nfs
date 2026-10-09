import type { Mat3, Point, Quad } from "@/types/geometry";

const EPSILON = 1e-9;

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** True when the corners form a convex quad with no collinear or repeated corners. */
export function isConvexQuad(quad: Quad): boolean {
  const [p0, p1, p2, p3] = quad;
  const turns = [
    cross(p0, p1, p2),
    cross(p1, p2, p3),
    cross(p2, p3, p0),
    cross(p3, p0, p1),
  ];
  return (
    turns.every((turn) => turn > EPSILON) ||
    turns.every((turn) => turn < -EPSILON)
  );
}

/**
 * Homography mapping the unit square onto `quad`:
 * (0,0) -> quad[0], (1,0) -> quad[1], (1,1) -> quad[2], (0,1) -> quad[3].
 */
export function squareToQuad(quad: Quad): Mat3 {
  if (!isConvexQuad(quad)) {
    throw new Error("Cannot fit a homography to a non-convex or degenerate quad");
  }
  const [p0, p1, p2, p3] = quad;

  const dx1 = p1.x - p2.x;
  const dy1 = p1.y - p2.y;
  const dx2 = p3.x - p2.x;
  const dy2 = p3.y - p2.y;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const sy = p0.y - p1.y + p2.y - p3.y;

  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;

  return [
    p1.x - p0.x + g * p1.x, p3.x - p0.x + h * p3.x, p0.x,
    p1.y - p0.y + g * p1.y, p3.y - p0.y + h * p3.y, p0.y,
    g, h, 1,
  ];
}

/** Homography mapping `quad` onto the unit square; the inverse of `squareToQuad`. */
export function quadToSquare(quad: Quad): Mat3 {
  return invert(squareToQuad(quad));
}

export function invert(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;

  const co0 = e * i - f * h;
  const co1 = f * g - d * i;
  const co2 = d * h - e * g;
  const det = a * co0 + b * co1 + c * co2;
  if (Math.abs(det) < Number.EPSILON) {
    throw new Error("Matrix is not invertible");
  }

  return [
    co0 / det, (c * h - b * i) / det, (b * f - c * e) / det,
    co1 / det, (a * i - c * g) / det, (c * d - a * f) / det,
    co2 / det, (b * g - a * h) / det, (a * e - b * d) / det,
  ];
}

export function applyHomography(m: Mat3, point: Point): Point {
  const [a, b, c, d, e, f, g, h, i] = m;
  const w = g * point.x + h * point.y + i;
  return {
    x: (a * point.x + b * point.y + c) / w,
    y: (d * point.x + e * point.y + f) / w,
  };
}
