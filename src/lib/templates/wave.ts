const TAU = Math.PI * 2;

/** Sine wave with whole-number frequencies, so it repeats exactly across the tile. */
export function wave(u: number, v: number, fu: number, fv: number, shift: number): number {
  return Math.sin(TAU * (fu * u + fv * v) + shift);
}

export function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/** A colour as red, green and blue, each 0..255. */
export type Rgb = readonly [number, number, number];
