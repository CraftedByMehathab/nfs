"use client";

import { TemplatePicker } from "@/components/TemplatePicker";
import type { Template } from "@/types/template";

const MIN_PATTERN_SIZE = 0.5;
const MAX_PATTERN_SIZE = 2;

type FinishControlsProps = {
  template: Template;
  onTemplateChange: (template: Template) => void;
  /** 1 is the template's normal size; larger values repeat the texture fewer times. */
  patternSize: number;
  onPatternSizeChange: (size: number) => void;
};

export function FinishControls({
  template,
  onTemplateChange,
  patternSize,
  onPatternSizeChange,
}: FinishControlsProps) {
  return (
    <>
      <TemplatePicker selectedId={template.id} onSelect={onTemplateChange} />
      <label className="flex items-center gap-3 text-sm">
        Pattern size
        <input
          type="range"
          min={MIN_PATTERN_SIZE}
          max={MAX_PATTERN_SIZE}
          step={0.05}
          value={patternSize}
          onChange={(event) => onPatternSizeChange(event.currentTarget.valueAsNumber)}
          className="w-40 accent-sky-500"
        />
      </label>
    </>
  );
}
