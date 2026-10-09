import type { Template } from "@/types/template";
import { createRandom } from "./random";
import { wave, type Rgb } from "./wave";

// How far the brightness drifts across the tile, and how much each pixel jitters.
const MOTTLE = 0.04;
const GRAIN = 0.015;

type SolidOptions = {
  seed: number;
  color: Rgb;
};

/** Solid-colour epoxy: one colour with a faint roller mottle, so it does not look flat. */
export function createSolid({ seed, color }: SolidOptions): Template["draw"] {
  return (context, size) => {
    const random = createRandom(seed);
    const image = context.createImageData(size, size);
    const pixels = image.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        const drift = 0.5 * wave(u, v, 1, 1, 0.7) + 0.3 * wave(u, v, 2, -1, 2.3) + 0.2 * wave(u, v, -1, 3, 4.1);
        const brightness = 1 + MOTTLE * drift + GRAIN * (random() * 2 - 1);

        const offset = (y * size + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          pixels[offset + channel] = (color[channel] ?? 0) * brightness;
        }
        pixels[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  };
}
