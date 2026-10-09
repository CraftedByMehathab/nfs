import type { FloorDetectionState } from "@/components/useFloorDetection";
import type { SelectionLayer } from "@/components/SelectionEditor";

const DEVICE_NAMES = { webgpu: "WebGPU", wasm: "WebAssembly" } as const;

type HintInput = {
  showOriginal: boolean;
  brushing: boolean;
  perspectiveValid: boolean;
  detection: FloorDetectionState;
  /** True when the outline is a painted or detected mask, not a polygon. */
  maskIsImage: boolean;
  customOutline: boolean;
  layer: SelectionLayer;
};

/** The one line of guidance under the picture. */
export function selectionHint({
  showOriginal,
  brushing,
  perspectiveValid,
  detection,
  maskIsImage,
  customOutline,
  layer,
}: HintInput): string {
  if (showOriginal) return "This is your original photo.";
  if (brushing) {
    return "Paint over floor that was missed, or switch to Erase to take the finish off things that are not floor.";
  }
  if (detection.status === "running") {
    return "Finding the floor… The first run downloads the detection model.";
  }
  if (!perspectiveValid) {
    return "The perspective corners are crossed or folded in. Move them so they make a simple four-sided shape.";
  }
  if (detection.status === "found" && maskIsImage) {
    const { inferenceMs, device, corners } = detection.detection;
    const found = `Floor found in ${Math.round(inferenceMs)} ms on ${DEVICE_NAMES[device]}.`;
    return corners
      ? `${found} The orange corners are a first guess at the perspective; if the pattern looks skewed, drag them onto a rectangle on the floor.`
      : `${found} Place the four orange corners on a rectangle on the floor to set the perspective.`;
  }
  if (detection.status === "empty") {
    return "No floor was found in this photo. Mark it by hand with the corners.";
  }
  if (detection.status === "failed") {
    return "Floor detection could not run. Mark the floor by hand with the corners.";
  }
  if (maskIsImage) {
    return "Drag the four orange corners onto a rectangle on the floor to set the perspective. Use the brush to change where the finish shows.";
  }
  if (!customOutline) {
    return "Drag the four corners to the edges of your floor. Tap + on an edge to add a point for other shapes.";
  }
  if (layer === "outline") {
    return "Drag the points around your floor. Tap + to add a point, or double-tap a point to remove it.";
  }
  return "Place the four orange corners on any rectangle on the floor, such as the room's corners or a slab joint.";
}
