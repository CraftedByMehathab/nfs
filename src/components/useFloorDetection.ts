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

  async function detect(): Promise<void> {
    setState({ status: "running" });
    let next: FloorDetectionState;
    try {
      const detection = await detectFloor(photo);
      console.debug("Floor detection", {
        device: detection.device,
        loadMs: Math.round(detection.loadMs),
        inferenceMs: Math.round(detection.inferenceMs),
        coverage: Number(detection.coverage.toFixed(3)),
        classes: detection.classes.slice(0, 5).map(({ label, share }) => `${label} ${Math.round(share * 100)}%`),
      });
      next = detection.mask
        ? { status: "found", detection, mask: detection.mask }
        : { status: "empty" };
    } catch (error) {
      console.error("Floor detection failed", error);
      next = { status: "failed" };
    }
    if (mounted.current) setState(next);
  }

  return { state, detect, clear: () => setState(IDLE) };
}
