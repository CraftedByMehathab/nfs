"use client";

import { ACTIVE_BUTTON, SECONDARY_BUTTON } from "@/components/buttonStyles";

type SegmentedToggleProps<T extends string> = {
  /** Accessible name for the group. */
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedToggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap justify-center gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={value === option.id ? ACTIVE_BUTTON : SECONDARY_BUTTON}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
