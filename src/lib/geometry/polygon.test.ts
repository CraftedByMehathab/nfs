import { describe, expect, it } from "vitest";
import type { Polygon } from "@/types/geometry";
import { edgeMidpoints, insertPoint, movePoint, removePoint } from "./polygon";

const SQUARE: Polygon = [
  { x: 0.2, y: 0.2 },
  { x: 0.8, y: 0.2 },
  { x: 0.8, y: 0.8 },
  { x: 0.2, y: 0.8 },
];

describe("movePoint", () => {
  it("moves one point, clamped to the image, without mutating the input", () => {
    const moved = movePoint(SQUARE, 1, { x: 1.3, y: 0.1 });
    expect(moved[1]).toEqual({ x: 1, y: 0.1 });
    expect(moved[0]).toBe(SQUARE[0]);
    expect(SQUARE[1]).toEqual({ x: 0.8, y: 0.2 });
  });
});

describe("edgeMidpoints", () => {
  it("returns one midpoint per edge, including the closing edge", () => {
    expect(edgeMidpoints(SQUARE)).toEqual([
      { x: 0.5, y: 0.2 },
      { x: 0.8, y: 0.5 },
      { x: 0.5, y: 0.8 },
      { x: 0.2, y: 0.5 },
    ]);
  });
});

describe("insertPoint", () => {
  it("inserts the midpoint after the edge's first point", () => {
    const next = insertPoint(SQUARE, 1);
    expect(next).toHaveLength(5);
    expect(next[2]).toEqual({ x: 0.8, y: 0.5 });
    expect(next[1]).toBe(SQUARE[1]);
    expect(next[3]).toBe(SQUARE[2]);
  });

  it("appends when splitting the closing edge", () => {
    const next = insertPoint(SQUARE, 3);
    expect(next[4]).toEqual({ x: 0.2, y: 0.5 });
  });

  it("ignores an edge that does not exist", () => {
    expect(insertPoint(SQUARE, 9)).toBe(SQUARE);
  });
});

describe("removePoint", () => {
  it("removes the chosen point", () => {
    expect(removePoint(SQUARE, 0)).toEqual(SQUARE.slice(1));
  });

  it("never drops below three points", () => {
    const triangle = SQUARE.slice(0, 3);
    expect(removePoint(triangle, 0)).toBe(triangle);
  });
});
