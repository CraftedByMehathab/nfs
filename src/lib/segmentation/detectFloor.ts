import { fitQuadToMask } from "@/lib/geometry/fitQuad";
import { maskCoverage, maskToCanvas } from "@/lib/image/mask";
import type { Quad } from "@/types/geometry";
import type { ClassShare } from "./logits";
import type { DetectRequest, DetectResponse, SegmentationDevice } from "./protocol";

// Below this share of the photo, treat the result as "no floor here".
const MIN_FLOOR_COVERAGE = 0.01;

export type FloorDetection = {
  /** White where the floor is, same size as the photo; null when no floor was found. */
  mask: HTMLCanvasElement | null;
  /**
   * Four corners fitted around the floor, as a first guess at its perspective;
   * null when no floor was found or its shape gave nothing usable.
   */
  corners: Quad | null;
  /** Share of the photo that is floor, 0..1. */
  coverage: number;
  device: SegmentationDevice;
  loadMs: number;
  inferenceMs: number;
  classes: ClassShare[];
};

type Pending = {
  size: { width: number; height: number };
  resolve: (detection: FloorDetection) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function failAll(error: Error): void {
  pending.forEach(({ reject }) => reject(error));
  pending.clear();
}

function handleResponse(response: DetectResponse): void {
  const request = pending.get(response.id);
  if (!request) return;
  pending.delete(response.id);
  if (!response.ok) {
    request.reject(new Error(response.error));
    return;
  }
  const { mask, maskWidth, maskHeight, device, loadMs, inferenceMs, classes } = response;
  const coverage = maskCoverage(mask);
  const found = coverage >= MIN_FLOOR_COVERAGE;
  request.resolve({
    mask: found ? maskToCanvas(mask, { width: maskWidth, height: maskHeight }, request.size) : null,
    corners: found
      ? fitQuadToMask(mask, maskWidth, maskHeight, request.size.width / request.size.height)
      : null,
    coverage,
    device,
    loadMs,
    inferenceMs,
    classes,
  });
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<DetectResponse>) => handleResponse(event.data));
    worker.addEventListener("error", (event) => {
      failAll(new Error(event.message || "The floor detection worker crashed"));
      worker?.terminate();
      worker = null;
    });
  }
  return worker;
}

/** Lets `?segmentation=wasm` or `?segmentation=webgpu` in the URL force a backend, for benchmarking. */
function forcedDevice(): SegmentationDevice | undefined {
  const value = new URLSearchParams(window.location.search).get("segmentation");
  return value === "wasm" || value === "webgpu" ? value : undefined;
}

/**
 * Finds the floor in `photo` with a segmentation model running in a web worker.
 * The first call downloads the model. Browser-only.
 */
export async function detectFloor(photo: ImageBitmap): Promise<FloorDetection> {
  // The worker takes ownership of what it is sent, so give it a copy.
  const copy = await createImageBitmap(photo);
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { size: { width: photo.width, height: photo.height }, resolve, reject });
    const request: DetectRequest = { id, photo: copy, device: forcedDevice() };
    getWorker().postMessage(request, [copy]);
  });
}
