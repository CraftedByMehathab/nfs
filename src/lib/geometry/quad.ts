import type { Point, Quad } from "@/types/geometry";

export type CornerIndex = 0 | 1 | 2 | 3;

export const CORNER_INDICES: readonly CornerIndex[] = [0, 1, 2, 3];

/** Starting selection in normalised image coordinates: a trapezoid over the lower half. */
export const DEFAULT_QUAD: Quad = [
  { x: 0.3, y: 0.55 },
  { x: 0.7, y: 0.55 },
  { x: 0.95, y: 0.95 },
  { x: 0.05, y: 0.95 },
];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Keeps a normalised point inside the image. */
export function clampToImage(point: Point): Point {
  return { x: clamp01(point.x), y: clamp01(point.y) };
}

/** Returns a copy of `quad` with one corner moved, kept inside the unit square. */
export function moveCorner(quad: Quad, index: CornerIndex, to: Point): Quad {
  const next: [Point, Point, Point, Point] = [...quad];
  next[index] = clampToImage(to);
  return next;
}
