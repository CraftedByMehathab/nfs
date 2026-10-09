"use client";

import { TemplatePicker } from "@/components/TemplatePicker";
import type { Template } from "@/types/template";

export type FinishSettings = {
  template: Template;
  /** 1 is the template's normal size; larger values repeat the texture fewer times. */
  patternSize: number;
  /** How strongly the photo's shadows and highlights show on the finish, 0..1. */
  shading: number;
};

type FinishControlsProps = {
  value: FinishSettings;
  onChange: (value: FinishSettings) => void;
};

type SliderProps = {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

function Slider({ label, min, max, value, onChange }: SliderProps) {
  return (
    <label className="flex items-center gap-3 text-sm">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="h-11 w-32 accent-sky-500"
      />
    </label>
  );
}

export function FinishControls({ value, onChange }: FinishControlsProps) {
  return (
    <>
      <TemplatePicker
        selectedId={value.template.id}
        onSelect={(template) => onChange({ ...value, template })}
      />
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Slider
          label="Pattern size"
          min={0.5}
          max={2}
          value={value.patternSize}
          onChange={(patternSize) => onChange({ ...value, patternSize })}
        />
        <Slider
          label="Shadows"
          min={0}
          max={1}
          value={value.shading}
          onChange={(shading) => onChange({ ...value, shading })}
        />
      </div>
    </>
  );
}
