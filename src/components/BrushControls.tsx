"use client";

import { SegmentedToggle } from "@/components/SegmentedToggle";
import type { BrushMode } from "@/lib/image/mask";

const MIN_BRUSH_SIZE = 10;
const MAX_BRUSH_SIZE = 160;

const MODES: readonly { id: BrushMode; label: string }[] = [
  { id: "add", label: "Add floor" },
  { id: "erase", label: "Erase" },
];

type BrushControlsProps = {
  mode: BrushMode;
  onModeChange: (mode: BrushMode) => void;
  /** Brush diameter in photo pixels. */
  size: number;
  onSizeChange: (size: number) => void;
};

export function BrushControls({ mode, onModeChange, size, onSizeChange }: BrushControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <SegmentedToggle label="Brush mode" options={MODES} value={mode} onChange={onModeChange} />
      <label className="flex items-center gap-3 text-sm">
        Brush size
        <input
          type="range"
          min={MIN_BRUSH_SIZE}
          max={MAX_BRUSH_SIZE}
          step={2}
          value={size}
          onChange={(event) => onSizeChange(event.currentTarget.valueAsNumber)}
          className="h-11 w-32 accent-sky-500"
        />
      </label>
    </div>
  );
}
