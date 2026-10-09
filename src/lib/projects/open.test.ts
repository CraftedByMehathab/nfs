import { describe, expect, it } from "vitest";
import { parsePolygon, parseQuad } from "./open";

const SQUARE = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

describe("parsePolygon", () => {
  it("reads three or more points", () => {
    expect(parsePolygon(SQUARE.slice(0, 3))).toEqual(SQUARE.slice(0, 3));
    expect(parsePolygon([...SQUARE, { x: 0.5, y: 0.5 }])).toHaveLength(5);
  });

  it("drops fields other than x and y", () => {
    expect(parsePolygon(SQUARE.map((point) => ({ ...point, label: "corner" })))).toEqual(SQUARE);
  });

  it("rejects anything that is not a list of points", () => {
    expect(parsePolygon(null)).toBeNull();
    expect(parsePolygon("[]")).toBeNull();
    expect(parsePolygon({ x: 0, y: 0 })).toBeNull();
    expect(parsePolygon(SQUARE.slice(0, 2))).toBeNull();
    expect(parsePolygon([...SQUARE.slice(0, 3), { x: "1", y: 1 }])).toBeNull();
    expect(parsePolygon([...SQUARE.slice(0, 3), [0, 1]])).toBeNull();
  });
});

describe("parseQuad", () => {
  it("reads exactly four points, in order", () => {
    expect(parseQuad(SQUARE)).toEqual(SQUARE);
  });

  it("rejects any other number of points", () => {
    expect(parseQuad(SQUARE.slice(0, 3))).toBeNull();
    expect(parseQuad([...SQUARE, { x: 0.5, y: 0.5 }])).toBeNull();
  });
});
