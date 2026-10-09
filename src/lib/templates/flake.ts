import { createRandom, pick } from "./random";

const BASE = "#8d9199";
const CHIP_COLORS = ["#1f2328", "#f2f2ee", "#6f757d", "#3d5a80", "#b9bec6", "#f2f2ee"] as const;
const CHIP_COUNT = 2600;
const MIN_RADIUS = 3;
const MAX_RADIUS = 9;

/** Vinyl-flake broadcast: irregular coloured chips scattered over a grey base coat. */
export function drawFlake(context: CanvasRenderingContext2D, size: number): void {
  const random = createRandom(11);
  context.fillStyle = BASE;
  context.fillRect(0, 0, size, size);

  for (let chip = 0; chip < CHIP_COUNT; chip++) {
    const centerX = random() * size;
    const centerY = random() * size;
    const radius = MIN_RADIUS + random() * (MAX_RADIUS - MIN_RADIUS);
    const corners = 4 + Math.floor(random() * 3);
    const turn = random() * Math.PI * 2;
    const reach = Array.from({ length: corners }, () => radius * (0.55 + random() * 0.45));
    context.fillStyle = pick(random, CHIP_COLORS);

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
}
