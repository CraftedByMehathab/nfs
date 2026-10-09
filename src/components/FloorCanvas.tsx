"use client";

import { useEffect, useRef, useState } from "react";
import { isConvexQuad, quadToSquare } from "@/lib/geometry/homography";
import { createFloorRenderer, type FloorRenderer } from "@/lib/gl/floorRenderer";
import { isWebGL2Available } from "@/lib/gl/support";
import { drawPolygonMask } from "@/lib/image/mask";
import type { Polygon, Quad } from "@/types/geometry";

type FloorCanvasProps = {
  photo: ImageBitmap;
  /** Four corners of a rectangle on the floor, in normalised image coordinates. */
  perspective: Quad;
  /** Where the floor finish is shown, in normalised image coordinates. */
  outline: Polygon;
  /** A detected or painted floor mask, white where the floor is; replaces `outline` when set. */
  maskImage: TexImageSource | null;
  /** Changes whenever `maskImage` is painted on, since the object itself stays the same. */
  maskVersion: number;
  floorTexture: TexImageSource;
  tiles: readonly [number, number];
  opacity: number;
};

export function FloorCanvas({
  photo,
  perspective,
  outline,
  maskImage,
  maskVersion,
  floorTexture,
  tiles,
  opacity,
}: FloorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FloorRenderer | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  // Only mounted in the browser once a photo exists, so probing here is safe.
  const [supported] = useState(isWebGL2Available);
  // Bumped when the browser restores a lost context, to rebuild every GL resource.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onLost = (event: Event) => {
      // Without preventDefault the browser never restores the context.
      event.preventDefault();
      // Everything the renderer owns died with the context; drop it now.
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
    const onRestored = () => setGeneration((current) => current + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, []);

  // The effects below run in order: create the renderer, upload, then draw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createFloorRenderer(canvas);
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [generation]);

  useEffect(() => {
    rendererRef.current?.setPhoto(photo);
  }, [photo, generation]);

  useEffect(() => {
    rendererRef.current?.setFloorTexture(floorTexture);
  }, [floorTexture, generation]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (maskImage) {
      renderer.setMask(maskImage);
      return;
    }
    maskRef.current ??= document.createElement("canvas");
    drawPolygonMask(maskRef.current, outline, photo);
    renderer.setMask(maskRef.current);
  }, [outline, maskImage, maskVersion, photo, generation]);

  useEffect(() => {
    rendererRef.current?.render({
      imageToPlane: isConvexQuad(perspective) ? quadToSquare(perspective) : null,
      tiles,
      opacity,
    });
  }, [photo, perspective, outline, maskImage, maskVersion, floorTexture, tiles, opacity, generation]);

  if (!supported) {
    return (
      <p role="alert" className="p-6 text-center text-sm text-red-600 dark:text-red-400">
        This browser cannot show the floor preview because WebGL2 is unavailable.
      </p>
    );
  }

  return <canvas ref={canvasRef} className="block h-full w-full rounded-lg" />;
}
