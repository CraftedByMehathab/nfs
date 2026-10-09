export type Point = {
  readonly x: number;
  readonly y: number;
};

/** Four corners in order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = readonly [Point, Point, Point, Point];

/** 3x3 matrix in row-major order. */
export type Mat3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

/** Closed outline of three or more points, in drawing order. */
export type Polygon = readonly Point[];
