"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { isConvexQuad, quadToSquare } from "@/lib/geometry/homography";
import { createFloorRenderer, type FloorRenderer } from "@/lib/gl/floorRenderer";
import { isWebGL2Available } from "@/lib/gl/support";
import { averageMaskedLuminance, samplePixels } from "@/lib/image/luminance";
import { drawPolygonMask } from "@/lib/image/mask";
import type { Polygon, Quad } from "@/types/geometry";

export type FloorCanvasHandle = {
  /** The finished picture as a JPEG, or null if it cannot be captured. */
  capture: () => Promise<Blob | null>;
};

type FloorCanvasProps = {
  ref?: Ref<FloorCanvasHandle>;
  photo: ImageBitmap;
  /** Four corners of a rectangle on the floor, in normalised image coordinates. */
  perspective: Quad;
  /** Where the floor finish is shown, in normalised image coordinates. */
  outline: Polygon;
  /** A detected or painted floor mask, white where the floor is; replaces `outline` when set. */
  maskImage: HTMLCanvasElement | null;
  /** Changes whenever `maskImage` is painted on, since the object itself stays the same. */
  maskVersion: number;
  floorTexture: TexImageSource;
  tiles: readonly [number, number];
  /** Before/after divider position, 0..1; the original photo shows left of it. */
  split: number;
  /** How strongly the photo's shadows and highlights carry onto the finish, 0..1. */
  shading: number;
};

export function FloorCanvas({
  ref,
  photo,
  perspective,
  outline,
  maskImage,
  maskVersion,
  floorTexture,
  tiles,
  split,
  shading,
}: FloorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FloorRenderer | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  // Average brightness of the original floor, which shading is measured against.
  const referenceLuminance = useRef(0);
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
    let mask = maskImage;
    if (!mask) {
      maskRef.current ??= document.createElement("canvas");
      drawPolygonMask(maskRef.current, outline, photo);
      mask = maskRef.current;
    }
    renderer.setMask(mask);
    referenceLuminance.current = averageMaskedLuminance(samplePixels(photo), samplePixels(mask));
  }, [outline, maskImage, maskVersion, photo, generation]);

  useEffect(() => {
    rendererRef.current?.render({
      imageToPlane: isConvexQuad(perspective) ? quadToSquare(perspective) : null,
      tiles,
      split,
      shading,
      referenceLuminance: referenceLuminance.current,
    });
  }, [
    photo,
    perspective,
    outline,
    maskImage,
    maskVersion,
    floorTexture,
    tiles,
    split,
    shading,
    generation,
  ]);

  useImperativeHandle(
    ref,
    () => ({ capture: () => rendererRef.current?.capture() ?? Promise.resolve(null) }),
    [],
  );

  if (!supported) {
    return (
      <p role="alert" className="p-6 text-center text-sm text-red-600 dark:text-red-400">
        This browser cannot show the floor preview because WebGL2 is unavailable.
      </p>
    );
  }

  return <canvas ref={canvasRef} className="block h-full w-full rounded-lg" />;
}
