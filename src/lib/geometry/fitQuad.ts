import type { Point, Quad } from "@/types/geometry";
import { isConvexQuad } from "./homography";
import { clampToImage } from "./quad";

const ON = 128;

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs(cross(a, b, c)) / 2;
}

/** Marks the largest connected blob of on-pixels (joined along edges, not diagonals). */
export function largestRegion(mask: ArrayLike<number>, width: number, height: number): Uint8Array {
  const labels = new Int32Array(width * height).fill(-1);
  const stack: number[] = [];
  let bestLabel = -1;
  let bestSize = 0;
  let label = 0;

  for (let start = 0; start < labels.length; start++) {
    if ((mask[start] ?? 0) < ON || labels[start] !== -1) continue;
    let size = 0;
    labels[start] = label;
    stack.push(start);
    for (let index = stack.pop(); index !== undefined; index = stack.pop()) {
      size++;
      const x = index % width;
      const neighbours = [
        x > 0 ? index - 1 : -1,
        x < width - 1 ? index + 1 : -1,
        index - width,
        index + width,
      ];
      for (const next of neighbours) {
        if (next < 0 || next >= labels.length) continue;
        if ((mask[next] ?? 0) < ON || labels[next] !== -1) continue;
        labels[next] = label;
        stack.push(next);
      }
    }
    if (size > bestSize) {
      bestSize = size;
      bestLabel = label;
    }
    label++;
  }

  return Uint8Array.from(labels, (value) => (value === bestLabel && bestLabel >= 0 ? 1 : 0));
}

/** The outer corners of the first and last on-pixel in each row: enough to build a convex hull. */
function rowExtents(region: Uint8Array, width: number, height: number): Point[] {
  const points: Point[] = [];
  for (let y = 0; y < height; y++) {
    let left = -1;
    let right = -1;
    for (let x = 0; x < width; x++) {
      if (region[y * width + x]) {
        if (left < 0) left = x;
        right = x;
      }
    }
    if (left < 0) continue;
    points.push({ x: left, y }, { x: left, y: y + 1 }, { x: right + 1, y }, { x: right + 1, y: y + 1 });
  }
  return points;
}

/** Convex hull by Andrew's monotone chain, without collinear points. */
export function convexHull(points: readonly Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length < 3) return sorted;

  const build = (input: readonly Point[]): Point[] => {
    const chain: Point[] = [];
    for (const point of input) {
      for (let n = chain.length; n >= 2; n = chain.length) {
        const a = chain[n - 2];
        const b = chain[n - 1];
        if (!a || !b || cross(a, b, point) > 0) break;
        chain.pop();
      }
      chain.push(point);
    }
    chain.pop();
    return chain;
  };

  return [...build(sorted), ...build(sorted.reverse())];
}

/** Where the line through a→b meets the line through d→c, if it lies beyond both b and c. */
function extendToMeet(a: Point, b: Point, c: Point, d: Point): Point | null {
  const rx = b.x - a.x;
  const ry = b.y - a.y;
  const sx = c.x - d.x;
  const sy = c.y - d.y;
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) < 1e-12) return null;
  const t = ((d.x - a.x) * sy - (d.y - a.y) * sx) / denominator;
  const u = ((d.x - a.x) * ry - (d.y - a.y) * rx) / denominator;
  if (t < 1 || u < 1) return null;
  return { x: a.x + t * rx, y: a.y + t * ry };
}

/**
 * Shrinks a convex polygon to four corners. Each step drops the edge that costs
 * the least extra area when its two neighbours are extended until they meet, so
 * long straight sides survive and rounded or noisy corners become sharp ones.
 */
export function reduceToFourCorners(hull: readonly Point[]): Point[] {
  const polygon = [...hull];
  while (polygon.length > 4) {
    const n = polygon.length;
    let bestCost = Infinity;
    let bestIndex = -1;
    let bestPoint: Point | null = null;

    for (let i = 0; i < n; i++) {
      const a = polygon[(i + n - 1) % n];
      const b = polygon[i];
      const c = polygon[(i + 1) % n];
      const d = polygon[(i + 2) % n];
      if (!a || !b || !c || !d) continue;
      const meeting = extendToMeet(a, b, c, d);
      if (!meeting) continue;
      const cost = triangleArea(b, meeting, c);
      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = i;
        bestPoint = meeting;
      }
    }

    if (bestPoint) {
      polygon[bestIndex] = bestPoint;
      polygon.splice((bestIndex + 1) % n, 1);
      continue;
    }

    // No pair of neighbours converges, so drop the corner that changes the shape least.
    let flattest = 0;
    let flattestArea = Infinity;
    for (let i = 0; i < n; i++) {
      const a = polygon[(i + n - 1) % n];
      const b = polygon[i];
      const c = polygon[(i + 1) % n];
      if (!a || !b || !c) continue;
      const area = triangleArea(a, b, c);
      if (area < flattestArea) {
        flattestArea = area;
        flattest = i;
      }
    }
    polygon.splice(flattest, 1);
  }
  return polygon;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Rotates and flips four corners into top-left, top-right, bottom-right, bottom-left order. */
export function orderCorners(corners: readonly [Point, Point, Point, Point]): Quad {
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const box: Quad = [
    { x: Math.min(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.max(...ys) },
    { x: Math.min(...xs), y: Math.max(...ys) },
  ];

  const [a, b, c, d] = corners;
  const candidates: Quad[] = [];
  for (const ring of [[a, b, c, d], [d, c, b, a]] as const) {
    for (let shift = 0; shift < 4; shift++) {
      const [p0, p1, p2, p3] = [0, 1, 2, 3].map((i) => ring[(i + shift) % 4]);
      if (p0 && p1 && p2 && p3) candidates.push([p0, p1, p2, p3]);
    }
  }

  let best: Quad = corners;
  let bestCost = Infinity;
  for (const candidate of candidates) {
    const cost = candidate.reduce((sum, corner, i) => sum + distance(corner, box[i] ?? corner), 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = candidate;
    }
  }
  return best;
}

// A fitted corner sharper than this means the floor's visible shape is not a
// rectangle seen head-on, and using it would smear the pattern.
const MIN_CORNER_ANGLE = 40;
// How much narrower the far edge of the fallback shape is than the near edge.
const FALLBACK_FAR_WIDTH = 0.5;

/** The sharpest interior angle of `quad`, in degrees, measured in real pixels. */
export function sharpestCornerAngle(quad: Quad, aspectRatio: number): number {
  let sharpest = 180;
  quad.forEach((corner, i) => {
    const previous = quad[(i + 3) % 4];
    const next = quad[(i + 1) % 4];
    if (!previous || !next) return;
    const ax = (previous.x - corner.x) * aspectRatio;
    const ay = previous.y - corner.y;
    const bx = (next.x - corner.x) * aspectRatio;
    const by = next.y - corner.y;
    const cosine = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
    sharpest = Math.min(sharpest, (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI);
  });
  return sharpest;
}

/** A plain receding shape over the area `points` cover: full width near, narrower far. */
export function trapezoidOver(points: readonly Point[]): Quad | null {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  if (!(right > left) || !(bottom > top)) return null;
  const inset = ((right - left) * (1 - FALLBACK_FAR_WIDTH)) / 2;
  return [
    { x: left + inset, y: top },
    { x: right - inset, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

/**
 * Guesses the floor's perspective corners from a mask, in normalised image
 * coordinates. Returns null when the mask has no usable region.
 *
 * It fits four corners around the largest region. That is right when the floor
 * is a rectangle photographed roughly head-on. When the fit is too skewed to be
 * one, it falls back to a plain receding trapezoid over the same area. Either
 * way the result is a starting point for the user to adjust.
 *
 * `aspectRatio` is the photo's width divided by its height.
 */
export function fitQuadToMask(
  mask: ArrayLike<number>,
  width: number,
  height: number,
  aspectRatio: number,
): Quad | null {
  const region = largestRegion(mask, width, height);
  const hull = convexHull(rowExtents(region, width, height)).map((corner) =>
    clampToImage({ x: corner.x / width, y: corner.y / height }),
  );
  if (hull.length < 4) return null;

  const [a, b, c, d] = reduceToFourCorners(hull);
  if (a && b && c && d) {
    const quad = orderCorners([a, b, c, d]);
    if (isConvexQuad(quad) && sharpestCornerAngle(quad, aspectRatio) >= MIN_CORNER_ANGLE) {
      return quad;
    }
  }
  return trapezoidOver(hull);
}
