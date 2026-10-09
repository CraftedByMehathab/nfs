"use client";

import { useEffect, useRef, useState } from "react";
import { detectFloor, type FloorDetection } from "@/lib/segmentation/detectFloor";

export type FloorDetectionState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "found"; detection: FloorDetection; mask: HTMLCanvasElement }
  | { status: "empty" }
  | { status: "failed" };

const IDLE: FloorDetectionState = { status: "idle" };

/** Runs automatic floor detection on `photo` when asked, and tracks the outcome. */
export function useFloorDetection(photo: ImageBitmap) {
  const [state, setState] = useState<FloorDetectionState>(IDLE);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /** Resolves with the detection when a floor was found, otherwise null. */
  async function detect(): Promise<FloorDetection | null> {
    setState({ status: "running" });
    let next: FloorDetectionState;
    let found: FloorDetection | null = null;
    try {
      const detection = await detectFloor(photo);
      console.debug("Floor detection", {
        device: detection.device,
        loadMs: Math.round(detection.loadMs),
        inferenceMs: Math.round(detection.inferenceMs),
        coverage: Number(detection.coverage.toFixed(3)),
        corners: detection.corners?.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`) ?? null,
        classes: detection.classes.slice(0, 5).map(({ label, share }) => `${label} ${Math.round(share * 100)}%`),
      });
      if (detection.mask) {
        next = { status: "found", detection, mask: detection.mask };
        found = detection;
      } else {
        next = { status: "empty" };
      }
    } catch (error) {
      console.error("Floor detection failed", error);
      next = { status: "failed" };
    }
    if (!mounted.current) return null;
    setState(next);
    return found;
  }

  return { state, detect, clear: () => setState(IDLE) };
}
