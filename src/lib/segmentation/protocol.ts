import type { ClassShare } from "./logits";

export type SegmentationDevice = "webgpu" | "wasm";

/** Sent to the worker. The photo is transferred, so send a copy. */
export type DetectRequest = {
  id: number;
  photo: ImageBitmap;
  /** Forces a backend; by default WebGPU is used when available. */
  device?: SegmentationDevice;
};

export type DetectResult = {
  /**
   * Floor probability (0..255), one byte per position, at the model's output
   * resolution. It covers the whole photo, so stretch it to the photo's size.
   */
  mask: Uint8ClampedArray;
  maskWidth: number;
  maskHeight: number;
  device: SegmentationDevice;
  /** Time spent downloading and preparing the model in this call; 0 once it is loaded. */
  loadMs: number;
  /** Time from receiving the photo to having the mask, excluding model loading. */
  inferenceMs: number;
  /** What the model saw in the photo, largest area first. */
  classes: ClassShare[];
};

export type DetectResponse =
  | ({ id: number; ok: true } & DetectResult)
  | { id: number; ok: false; error: string };
