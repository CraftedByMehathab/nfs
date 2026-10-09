export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

const ZOOM_STEPS = [1, 1.5, 2, 3, 4] as const;
// Guards against float noise when comparing a zoom level with a step.
const EPSILON = 1e-6;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** The next preset zoom level above or below `zoom`. */
export function stepZoom(zoom: number, direction: "in" | "out"): number {
  if (direction === "in") {
    return ZOOM_STEPS.find((step) => step > zoom + EPSILON) ?? MAX_ZOOM;
  }
  return [...ZOOM_STEPS].reverse().find((step) => step < zoom - EPSILON) ?? MIN_ZOOM;
}

/**
 * The scroll offset that keeps one point of the picture under the same spot of
 * the viewport after the picture is scaled by `ratio` (new zoom / old zoom).
 *
 * `anchor` is that spot, measured from the viewport's edge, and `padding` is
 * the gap between the viewport's edge and the picture when not scrolled.
 */
export function scrollAfterZoom(scroll: number, anchor: number, padding: number, ratio: number): number {
  return (scroll + anchor - padding) * ratio + padding - anchor;
}
