const TAU = Math.PI * 2;
const DARK = [52, 58, 66] as const;
const LIGHT = [196, 205, 214] as const;
const SHINE = [245, 248, 250] as const;

/** Sine wave with whole-number frequencies, so it repeats exactly across the tile. */
function wave(u: number, v: number, fu: number, fv: number, shift: number): number {
  return Math.sin(TAU * (fu * u + fv * v) + shift);
}

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/** Metallic epoxy: slow, marbled swirls of pewter and silver. */
export function drawMetallic(context: CanvasRenderingContext2D, size: number): void {
  const image = context.createImageData(size, size);
  const pixels = image.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // Bend the coordinates before sampling, which turns stripes into swirls.
      const bendU = 0.35 * wave(u, v, 1, 2, 0.4) + 0.2 * wave(u, v, 3, -1, 2.1);
      const bendV = 0.35 * wave(u, v, 2, -1, 4.2) + 0.2 * wave(u, v, 1, 3, 1.3);
      const swirl =
        0.5 * wave(u, v, 2, 1, 3 * bendU) +
        0.3 * wave(u, v, -1, 3, 3 * bendV) +
        0.2 * wave(u, v, 4, 2, 4 * bendU + 2 * bendV);
      const tone = Math.min(1, Math.max(0, 0.5 + 0.5 * swirl));
      const shine = tone ** 6;

      const offset = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const base = mix(DARK[channel] ?? 0, LIGHT[channel] ?? 0, tone);
        pixels[offset + channel] = mix(base, SHINE[channel] ?? 0, shine);
      }
      pixels[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
}
