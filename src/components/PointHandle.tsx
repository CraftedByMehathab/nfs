"use client";

import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import type { Point } from "@/types/geometry";

const NUDGE = 0.005;

const ARROW_STEPS: Readonly<Record<string, Point>> = {
  ArrowLeft: { x: -NUDGE, y: 0 },
  ArrowRight: { x: NUDGE, y: 0 },
  ArrowUp: { x: 0, y: -NUDGE },
  ArrowDown: { x: 0, y: NUDGE },
};

const TONES = {
  outline: "bg-sky-500",
  perspective: "bg-amber-400",
} as const;

type PointHandleProps = {
  /** Position in normalised image coordinates. */
  point: Point;
  label: string;
  tone: keyof typeof TONES;
  /** Element the photo fills; pointer positions are measured against it. */
  frameRef: RefObject<HTMLDivElement | null>;
  onMove: (to: Point) => void;
  /** When set, double-click or Delete removes the point. */
  onRemove?: () => void;
};

export function PointHandle({ point, label, tone, frameRef, onMove, onRemove }: PointHandleProps) {
  // Distance from the pointer to the point at grab time, so the handle does not jump.
  const grabOffset = useRef<Point>({ x: 0, y: 0 });

  function pointerPosition(event: PointerEvent): Point | null {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>): void {
    const pointer = pointerPosition(event);
    if (!pointer) return;
    grabOffset.current = { x: point.x - pointer.x, y: point.y - pointer.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLButtonElement>): void {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const pointer = pointerPosition(event);
    if (!pointer) return;
    onMove({
      x: pointer.x + grabOffset.current.x,
      y: pointer.y + grabOffset.current.y,
    });
  }

  function handleKey(event: KeyboardEvent): void {
    if (onRemove && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      onRemove();
      return;
    }
    const step = ARROW_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    onMove({ x: point.x + step.x, y: point.y + step.y });
  }

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onDoubleClick={onRemove}
      onKeyDown={handleKey}
      className="group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full outline-none active:cursor-grabbing"
      style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
    >
      <span
        className={`h-4 w-4 rounded-full border-2 border-white shadow group-focus-visible:ring-2 group-focus-visible:ring-white ${TONES[tone]}`}
      />
    </button>
  );
}
