import type { Polygon } from "@/types/geometry";
import type { Size } from "./resize";

/**
 * Paints `polygon` (normalised image coordinates) white on black into `canvas`,
 * resized to `size`. White marks where the floor finish is shown.
 */
export function drawPolygonMask(
  canvas: HTMLCanvasElement,
  polygon: Polygon,
  size: Size,
): void {
  if (canvas.width !== size.width) canvas.width = size.width;
  if (canvas.height !== size.height) canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");

  context.fillStyle = "#000";
  context.fillRect(0, 0, size.width, size.height);

  context.beginPath();
  polygon.forEach((point, index) => {
    const x = point.x * size.width;
    const y = point.y * size.height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  context.fillStyle = "#fff";
  context.fill();
}
