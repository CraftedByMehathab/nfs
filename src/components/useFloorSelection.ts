"use client";

import { useReducer, useState } from "react";
import type { SelectionLayer } from "@/components/SelectionEditor";
import { useFloorDetection } from "@/components/useFloorDetection";
import { DEFAULT_QUAD } from "@/lib/geometry/quad";
import { drawPolygonMask } from "@/lib/image/mask";
import type { Polygon, Quad } from "@/types/geometry";

/** Where the finish goes on `photo`: the perspective corners plus an outline or mask. */
export function useFloorSelection(photo: ImageBitmap) {
  const [perspective, setPerspective] = useState<Quad>(DEFAULT_QUAD);
  // Null until a point is added; until then the outline is the perspective corners.
  const [outline, setOutline] = useState<Polygon | null>(null);
  const [layer, setLayer] = useState<SelectionLayer>("outline");
  // A detected or painted mask. While set, it replaces the polygon outline.
  const [mask, setMask] = useState<HTMLCanvasElement | null>(null);
  const [maskVersion, markMaskChanged] = useReducer((version: number) => version + 1, 0);
  const detection = useFloorDetection(photo);

  async function detectFloor(): Promise<void> {
    const found = await detection.detect();
    if (!found?.mask) return;
    setMask(found.mask);
    markMaskChanged();
    if (found.corners) setPerspective(found.corners);
  }

  /** Makes sure there is a paintable mask, starting from the current outline if needed. */
  function ensureMask(): void {
    if (mask) return;
    const canvas = document.createElement("canvas");
    drawPolygonMask(canvas, outline ?? perspective, photo);
    setMask(canvas);
  }

  function clearMask(): void {
    setMask(null);
    detection.clear();
  }

  function reset(): void {
    clearMask();
    setPerspective(DEFAULT_QUAD);
    setOutline(null);
    setLayer("outline");
  }

  return {
    perspective,
    setPerspective,
    outline,
    setOutline,
    layer,
    setLayer,
    mask,
    maskVersion,
    markMaskChanged,
    detection: detection.state,
    detecting: detection.state.status === "running",
    detectFloor,
    ensureMask,
    clearMask,
    reset,
  };
}
