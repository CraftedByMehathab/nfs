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

/** Share of a one-byte-per-pixel mask that is more than half on, 0..1. */
export function maskCoverage(mask: Uint8ClampedArray): number {
  if (mask.length === 0) return 0;
  let on = 0;
  for (const value of mask) {
    if (value > 127) on++;
  }
  return on / mask.length;
}

/** Expands a one-byte-per-pixel mask into opaque grey RGBA pixels. */
export function maskToRgba(mask: Uint8ClampedArray): Uint8ClampedArray<ArrayBuffer> {
  const pixels = new Uint8ClampedArray(mask.length * 4);
  mask.forEach((value, index) => {
    const offset = index * 4;
    pixels[offset] = value;
    pixels[offset + 1] = value;
    pixels[offset + 2] = value;
    pixels[offset + 3] = 255;
  });
  return pixels;
}

const EDGE_START = 0.35 * 255;
const EDGE_END = 0.65 * 255;

/**
 * Tightens a soft edge: values below 35% become off, above 65% become on, with
 * a smooth ramp between. Keeps a stretched low-resolution mask from looking blurry.
 */
export function sharpenEdge(value: number): number {
  const t = Math.min(1, Math.max(0, (value - EDGE_START) / (EDGE_END - EDGE_START)));
  return Math.round(t * t * (3 - 2 * t) * 255);
}

function createCanvas(size: Size): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2D canvas is unavailable");
  return [canvas, context];
}

/**
 * Stretches a low-resolution, one-byte-per-pixel mask over a canvas of `size`,
 * smoothing as it goes, then tightens the edges. White is where the mask is on.
 */
export function maskToCanvas(mask: Uint8ClampedArray, maskSize: Size, size: Size): HTMLCanvasElement {
  const [small, smallContext] = createCanvas(maskSize);
  smallContext.putImageData(new ImageData(maskToRgba(mask), maskSize.width, maskSize.height), 0, 0);

  const [canvas, context] = createCanvas(size);
  context.imageSmoothingQuality = "high";
  context.drawImage(small, 0, 0, size.width, size.height);

  const image = context.getImageData(0, 0, size.width, size.height);
  const pixels = image.data;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const value = sharpenEdge(pixels[offset] ?? 0);
    pixels[offset] = value;
    pixels[offset + 1] = value;
    pixels[offset + 2] = value;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export type BrushMode = "add" | "erase";

/**
 * Paints a round brush stroke between two points of a mask, in mask pixels.
 * "add" paints floor in (white); "erase" paints it out (black).
 */
export function paintStroke(
  mask: HTMLCanvasElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  diameter: number,
  mode: BrushMode,
): void {
  const context = mask.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  const color = mode === "add" ? "#fff" : "#000";
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = diameter;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  // A stroke of zero length draws nothing in some browsers, so stamp the end point too.
  context.beginPath();
  context.arc(to.x, to.y, diameter / 2, 0, Math.PI * 2);
  context.fill();
}
