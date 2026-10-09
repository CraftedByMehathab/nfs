import type { Template } from "@/types/template";
import { createRandom, pick } from "./random";

const CHIP_COUNT = 2600;
const MIN_RADIUS = 3;
const MAX_RADIUS = 9;

type FlakeOptions = {
  /** Fixes where the chips fall, so each finish has its own scatter. */
  seed: number;
  /** The base coat showing between the chips. */
  base: string;
  /** Chip colours; list a colour twice to make it twice as common. */
  chips: readonly [string, ...string[]];
};

/** Vinyl-flake broadcast: irregular coloured chips scattered over a base coat. */
export function createFlake({ seed, base, chips }: FlakeOptions): Template["draw"] {
  return (context, size) => {
    const random = createRandom(seed);
    context.fillStyle = base;
    context.fillRect(0, 0, size, size);

    for (let chip = 0; chip < CHIP_COUNT; chip++) {
      const centerX = random() * size;
      const centerY = random() * size;
      const radius = MIN_RADIUS + random() * (MAX_RADIUS - MIN_RADIUS);
      const corners = 4 + Math.floor(random() * 3);
      const turn = random() * Math.PI * 2;
      const reach = Array.from({ length: corners }, () => radius * (0.55 + random() * 0.45));
      context.fillStyle = pick(random, chips);

      // Repeat chips that cross an edge on the opposite side, so the tile is seamless.
      for (const offsetX of [-size, 0, size]) {
        for (const offsetY of [-size, 0, size]) {
          const x = centerX + offsetX;
          const y = centerY + offsetY;
          if (x < -radius || x > size + radius || y < -radius || y > size + radius) continue;
          context.beginPath();
          reach.forEach((distance, corner) => {
            const angle = turn + (corner / corners) * Math.PI * 2;
            context.lineTo(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
          });
          context.closePath();
          context.fill();
        }
      }
    }
  };
}
