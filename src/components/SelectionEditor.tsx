"use client";

import { useRef, type ReactNode } from "react";
import { PointHandle } from "@/components/PointHandle";
import {
  edgeMidpoints,
  insertPoint,
  MIN_POLYGON_POINTS,
  movePoint,
  removePoint,
} from "@/lib/geometry/polygon";
import { CORNER_INDICES, moveCorner } from "@/lib/geometry/quad";
import type { Polygon, Quad } from "@/types/geometry";

const CORNER_LABELS = [
  "Top-left corner",
  "Top-right corner",
  "Bottom-right corner",
  "Bottom-left corner",
] as const;

export type SelectionLayer = "outline" | "perspective";

type SelectionEditorProps = {
  /** Four corners of a rectangle on the floor; sets how the pattern recedes. */
  perspective: Quad;
  /** Custom floor outline, or null while the outline is the perspective corners. */
  outline: Polygon | null;
  /** Which set of points is editable once a custom outline exists. */
  layer: SelectionLayer;
  onPerspectiveChange: (perspective: Quad) => void;
  onOutlineChange: (outline: Polygon) => void;
  /** Photo width divided by height. */
  aspectRatio: number;
  perspectiveInvalid: boolean;
  /** False hides every outline and handle, leaving only the picture. */
  pointsVisible: boolean;
  children: ReactNode;
};

function svgPoints(polygon: Polygon): string {
  return polygon.map((point) => `${point.x},${point.y}`).join(" ");
}

export function SelectionEditor({
  perspective,
  outline,
  layer,
  onPerspectiveChange,
  onOutlineChange,
  aspectRatio,
  perspectiveInvalid,
  pointsVisible,
  children,
}: SelectionEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const shape: Polygon = outline ?? perspective;
  const editingPerspective = pointsVisible && (outline === null || layer === "perspective");
  const editingOutline = pointsVisible && outline !== null && layer === "outline";
  const perspectiveStroke = perspectiveInvalid ? "stroke-red-500" : "stroke-amber-400";

  return (
    <div
      ref={frameRef}
      className="relative touch-none select-none"
      style={{ aspectRatio, width: `min(100%, calc(70vh * ${aspectRatio}))` }}
    >
      {children}
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full fill-transparent"
        visibility={pointsVisible ? "visible" : "hidden"}
        aria-hidden="true"
      >
        <polygon
          points={svgPoints(shape)}
          className={outline === null && perspectiveInvalid ? "stroke-red-500" : "stroke-sky-400"}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {outline !== null && (
          <polygon
            points={svgPoints(perspective)}
            className={perspectiveStroke}
            strokeWidth={2}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {editingPerspective &&
        CORNER_INDICES.map((index) => (
          <PointHandle
            key={index}
            point={perspective[index]}
            label={CORNER_LABELS[index]}
            tone={outline === null ? "outline" : "perspective"}
            frameRef={frameRef}
            onMove={(to) => onPerspectiveChange(moveCorner(perspective, index, to))}
          />
        ))}

      {editingOutline &&
        outline.map((point, index) => (
          <PointHandle
            key={index}
            point={point}
            label={`Outline point ${index + 1}`}
            tone="outline"
            frameRef={frameRef}
            onMove={(to) => onOutlineChange(movePoint(outline, index, to))}
            onRemove={
              outline.length > MIN_POLYGON_POINTS
                ? () => onOutlineChange(removePoint(outline, index))
                : undefined
            }
          />
        ))}

      {pointsVisible &&
        (outline === null || editingOutline) &&
        edgeMidpoints(shape).map((midpoint, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Add a point after point ${index + 1}`}
            onClick={() => onOutlineChange(insertPoint(shape, index))}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-black/60 text-sm leading-none text-white hover:bg-sky-500"
            style={{ left: `${midpoint.x * 100}%`, top: `${midpoint.y * 100}%` }}
          >
            +
          </button>
        ))}
    </div>
  );
}
