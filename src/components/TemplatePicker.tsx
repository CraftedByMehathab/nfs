"use client";

import { useMemo, useState } from "react";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { getTemplateThumbnail, TEMPLATE_CATEGORIES, TEMPLATES } from "@/lib/templates";
import type { Template, TemplateCategory } from "@/types/template";

type TemplatePickerProps = {
  selectedId: string;
  onSelect: (template: Template) => void;
};

/** The finishes of one category at a time, with tabs to change category. */
export function TemplatePicker({ selectedId, onSelect }: TemplatePickerProps) {
  // Start on the category of the finish in use. Changing category does not change the finish.
  const [category, setCategory] = useState<TemplateCategory>(
    () => TEMPLATES.find((template) => template.id === selectedId)?.category ?? TEMPLATES[0].category,
  );
  // Only mounted in the browser once a photo exists, so painting thumbnails here is safe.
  // Only the category on show is painted.
  const shown = useMemo(
    () =>
      TEMPLATES.filter((template) => template.category === category).map((template) => ({
        template,
        thumbnail: getTemplateThumbnail(template),
      })),
    [category],
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <SegmentedToggle label="Finish type" options={TEMPLATE_CATEGORIES} value={category} onChange={setCategory} />
      <div role="radiogroup" aria-label="Floor finish" className="flex flex-wrap justify-center gap-3">
        {shown.map(({ template, thumbnail }) => {
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
                style={{ backgroundImage: `url(${thumbnail})` }}
              />
              {template.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
