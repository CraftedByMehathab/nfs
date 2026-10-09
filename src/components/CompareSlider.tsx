"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

const KEY_STEP = 0.02;
const LABEL =
  "pointer-events-none absolute top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white";

type CompareSliderProps = {
  /** Divider position as a share of the picture's width, 0..1. */
  value: number;
  onChange: (value: number) => void;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** A draggable divider over the picture: the original on its left, the finish on its right. */
export function CompareSlider({ value, onChange }: CompareSliderProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  function drag(event: PointerEvent<HTMLButtonElement>): void {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onChange(clamp01((event.clientX - rect.left) / rect.width));
  }

  function handleKey(event: KeyboardEvent): void {
    const step = event.key === "ArrowLeft" ? -KEY_STEP : event.key === "ArrowRight" ? KEY_STEP : 0;
    if (step === 0) return;
    event.preventDefault();
    onChange(clamp01(value + step));
  }

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 select-none">
      {value > 0.15 && <span className={`${LABEL} left-2`}>Before</span>}
      {value < 0.85 && <span className={`${LABEL} right-2`}>After</span>}
      <div
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        style={{ left: `${value * 100}%` }}
      />
      <button
        type="button"
        role="slider"
        aria-label="Before and after divider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        onPointerMove={drag}
        onKeyDown={handleKey}
        className="pointer-events-auto absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border-2 border-white bg-black/70 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        style={{ left: `${value * 100}%` }}
      >
        ↔
      </button>
    </div>
  );
}
