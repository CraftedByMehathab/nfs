export const MAX_EDGE = 1024;

export type Size = {
  readonly width: number;
  readonly height: number;
};

/** Scales `size` down so its long edge is at most `maxEdge`. Never upscales. */
export function fitWithin(size: Size, maxEdge: number): Size {
  const longEdge = Math.max(size.width, size.height);
  if (longEdge <= maxEdge) return size;
  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

function sourceSize(source: ImageBitmap | HTMLVideoElement): Size {
  return source instanceof HTMLVideoElement
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.width, height: source.height };
}

/** Draws an image or the current video frame into a new bitmap no larger than `maxEdge`. */
export async function resizeToBitmap(
  source: ImageBitmap | HTMLVideoElement,
  maxEdge: number = MAX_EDGE,
): Promise<ImageBitmap> {
  const original = sourceSize(source);
  if (original.width === 0 || original.height === 0) {
    throw new Error("Image has no pixels");
  }
  const target = fitWithin(original, maxEdge);

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, target.width, target.height);
  return createImageBitmap(canvas);
}

/** Decodes an image file (respecting EXIF orientation) and downsizes it to `maxEdge`. */
export async function decodeImageFile(
  file: Blob,
  maxEdge: number = MAX_EDGE,
): Promise<ImageBitmap> {
  const decoded = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    return await resizeToBitmap(decoded, maxEdge);
  } finally {
    decoded.close();
  }
}
