"use client";

import { useState } from "react";
import { getTemplateThumbnail, TEMPLATES } from "@/lib/templates";
import type { Template } from "@/types/template";

type TemplatePickerProps = {
  selectedId: string;
  onSelect: (template: Template) => void;
};

export function TemplatePicker({ selectedId, onSelect }: TemplatePickerProps) {
  // Only mounted in the browser once a photo exists, so painting thumbnails here is safe.
  const [thumbnails] = useState(() => TEMPLATES.map(getTemplateThumbnail));

  return (
    <div role="radiogroup" aria-label="Floor finish" className="flex flex-wrap justify-center gap-3">
      {TEMPLATES.map((template, index) => {
        const selected = template.id === selectedId;
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(template)}
            className="flex w-24 flex-col items-center gap-1.5 text-xs font-medium"
          >
            <span
              className={`h-20 w-20 rounded-lg bg-cover ring-2 ring-offset-2 ring-offset-background ${
                selected ? "ring-sky-500" : "ring-transparent"
              }`}
              style={{ backgroundImage: `url(${thumbnails[index] ?? ""})` }}
            />
            {template.name}
          </button>
        );
      })}
    </div>
  );
}
