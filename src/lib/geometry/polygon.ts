import type { Point, Polygon } from "@/types/geometry";
import { clampToImage } from "./quad";

export const MIN_POLYGON_POINTS = 3;

/** Returns a copy of `polygon` with one point moved, kept inside the image. */
export function movePoint(polygon: Polygon, index: number, to: Point): Polygon {
  return polygon.map((point, i) => (i === index ? clampToImage(to) : point));
}

/** Midpoint of each edge; entry `i` lies between point `i` and the next point. */
export function edgeMidpoints(polygon: Polygon): Point[] {
  return polygon.flatMap((point, i) => {
    const next = polygon[(i + 1) % polygon.length];
    if (!next) return [];
    return [{ x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 }];
  });
}

/** Inserts a new point at the middle of the edge that starts at `edgeIndex`. */
export function insertPoint(polygon: Polygon, edgeIndex: number): Polygon {
  const midpoint = edgeMidpoints(polygon)[edgeIndex];
  if (!midpoint) return polygon;
  return [
    ...polygon.slice(0, edgeIndex + 1),
    midpoint,
    ...polygon.slice(edgeIndex + 1),
  ];
}

/** Removes a point, unless that would leave fewer than three. */
export function removePoint(polygon: Polygon, index: number): Polygon {
  if (polygon.length <= MIN_POLYGON_POINTS) return polygon;
  return polygon.filter((_, i) => i !== index);
}
