import type { Template } from "@/types/template";
import { mix, wave, type Rgb } from "./wave";

type MetallicOptions = {
  dark: Rgb;
  light: Rgb;
  /** The colour of the brightest streaks. */
  shine: Rgb;
  /** Shifts the swirls, so each finish has its own pattern. */
  phase: number;
};

/** Metallic epoxy: slow, marbled swirls between a dark and a light tone. */
export function createMetallic({ dark, light, shine, phase }: MetallicOptions): Template["draw"] {
  return (context, size) => {
    const image = context.createImageData(size, size);
    const pixels = image.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        // Bend the coordinates before sampling, which turns stripes into swirls.
        const bendU = 0.35 * wave(u, v, 1, 2, 0.4 + phase) + 0.2 * wave(u, v, 3, -1, 2.1 - phase);
        const bendV = 0.35 * wave(u, v, 2, -1, 4.2 + phase) + 0.2 * wave(u, v, 1, 3, 1.3 - phase);
        const swirl =
          0.5 * wave(u, v, 2, 1, 3 * bendU) +
          0.3 * wave(u, v, -1, 3, 3 * bendV) +
          0.2 * wave(u, v, 4, 2, 4 * bendU + 2 * bendV);
        const tone = Math.min(1, Math.max(0, 0.5 + 0.5 * swirl));
        const gleam = tone ** 6;

        const offset = (y * size + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const base = mix(dark[channel] ?? 0, light[channel] ?? 0, tone);
          pixels[offset + channel] = mix(base, shine[channel] ?? 0, gleam);
        }
        pixels[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  };
}
