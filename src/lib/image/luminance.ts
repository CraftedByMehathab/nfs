const SAMPLE_SIZE = 64;

let scratch: CanvasRenderingContext2D | null = null;

/** Converts one sRGB channel value (0..255) to linear light (0..1). */
export function srgbToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Average linear luminance of the photo where the mask is on, weighted by how
 * on it is. Both inputs are RGBA pixels of the same size; the mask is read from
 * its red channel. Returns 0 when the mask is empty.
 */
export function averageMaskedLuminance(photo: ArrayLike<number>, mask: ArrayLike<number>): number {
  let total = 0;
  let weight = 0;
  for (let offset = 0; offset + 3 < photo.length; offset += 4) {
    const w = (mask[offset] ?? 0) / 255;
    if (w === 0) continue;
    const luminance =
      0.2126 * srgbToLinear(photo[offset] ?? 0) +
      0.7152 * srgbToLinear(photo[offset + 1] ?? 0) +
      0.0722 * srgbToLinear(photo[offset + 2] ?? 0);
    total += luminance * w;
    weight += w;
  }
  return weight > 0 ? total / weight : 0;
}

/** Shrinks an image to a small square and returns its RGBA pixels. Browser-only. */
export function samplePixels(source: CanvasImageSource): Uint8ClampedArray {
  if (!scratch) {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    scratch = canvas.getContext("2d", { willReadFrequently: true });
    if (!scratch) throw new Error("2D canvas is unavailable");
  }
  scratch.drawImage(source, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return scratch.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
}
