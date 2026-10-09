import { createRandom, pick } from "./random";

const GRAIN_COLORS = ["#c8b79a", "#a8977c", "#e6dccb", "#7d7263", "#d9cdb8", "#c8b79a"] as const;
const GRAIN_SIZE = 2;

/** Quartz broadcast: a dense, even layer of fine coloured sand grains. */
export function drawQuartz(context: CanvasRenderingContext2D, size: number): void {
  const random = createRandom(29);
  for (let y = 0; y < size; y += GRAIN_SIZE) {
    for (let x = 0; x < size; x += GRAIN_SIZE) {
      context.fillStyle = pick(random, GRAIN_COLORS);
      context.fillRect(x, y, GRAIN_SIZE, GRAIN_SIZE);
    }
  }
}
