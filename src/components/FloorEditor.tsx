"use client";

import { useMemo, useState } from "react";
import { FloorCanvas } from "@/components/FloorCanvas";
import { SelectionEditor, type SelectionLayer } from "@/components/SelectionEditor";
import { TemplatePicker } from "@/components/TemplatePicker";
import { isConvexQuad } from "@/lib/geometry/homography";
import { DEFAULT_QUAD } from "@/lib/geometry/quad";
import { getTemplateTexture, TEMPLATES } from "@/lib/templates";
import type { Polygon, Quad } from "@/types/geometry";
import type { Template } from "@/types/template";

const BUTTON = "rounded-full border px-5 py-2 text-sm font-medium";
const SECONDARY_BUTTON = `${BUTTON} border-black/10 dark:border-white/20`;
const ACTIVE_BUTTON = `${BUTTON} border-transparent bg-foreground text-background`;

const MIN_PATTERN_SIZE = 0.5;
const MAX_PATTERN_SIZE = 2;

const LAYERS: readonly { id: SelectionLayer; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "perspective", label: "Perspective" },
];

function hint(custom: boolean, layer: SelectionLayer, valid: boolean): string {
  if (!valid) {
    return "The perspective corners are crossed or folded in. Move them so they make a simple four-sided shape.";
  }
  if (!custom) {
    return "Drag the four corners to the edges of your floor. Tap + on an edge to add a point for other shapes.";
  }
  if (layer === "outline") {
    return "Drag the points around your floor. Tap + to add a point, or double-tap a point to remove it.";
  }
  return "Place the four orange corners on any rectangle on the floor, such as the room's corners or a slab joint.";
}

type FloorEditorProps = {
  photo: ImageBitmap;
  onChoosePhoto: () => void;
};

export function FloorEditor({ photo, onChoosePhoto }: FloorEditorProps) {
  const [perspective, setPerspective] = useState<Quad>(DEFAULT_QUAD);
  // Null until a point is added; until then the outline is the perspective corners.
  const [outline, setOutline] = useState<Polygon | null>(null);
  const [layer, setLayer] = useState<SelectionLayer>("outline");
  const [template, setTemplate] = useState<Template>(TEMPLATES[0]);
  // 1 is the template's normal size; larger values repeat the texture fewer times.
  const [patternSize, setPatternSize] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);

  const perspectiveValid = isConvexQuad(perspective);
  const repeats = template.scale / patternSize;
  const tiles = useMemo(() => [repeats, repeats] as const, [repeats]);

  function reset(): void {
    setPerspective(DEFAULT_QUAD);
    setOutline(null);
    setLayer("outline");
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <SelectionEditor
        perspective={perspective}
        outline={outline}
        layer={layer}
        onPerspectiveChange={setPerspective}
        onOutlineChange={setOutline}
        aspectRatio={photo.width / photo.height}
        perspectiveInvalid={!perspectiveValid}
        pointsVisible={!showOriginal}
      >
        <FloorCanvas
          photo={photo}
          perspective={perspective}
          outline={outline ?? perspective}
          floorTexture={getTemplateTexture(template)}
          tiles={tiles}
          opacity={showOriginal ? 0 : 1}
        />
      </SelectionEditor>
      {outline && !showOriginal && (
        <div role="group" aria-label="Points to edit" className="flex gap-2">
          {LAYERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={layer === id}
              onClick={() => setLayer(id)}
              className={layer === id ? ACTIVE_BUTTON : SECONDARY_BUTTON}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <p
        role="status"
        className={
          perspectiveValid || showOriginal
            ? "text-center text-sm text-zinc-600 dark:text-zinc-400"
            : "text-center text-sm text-red-600 dark:text-red-400"
        }
      >
        {showOriginal
          ? "This is your original photo."
          : hint(outline !== null, layer, perspectiveValid)}
      </p>
      <TemplatePicker selectedId={template.id} onSelect={setTemplate} />
      <label className="flex items-center gap-3 text-sm">
        Pattern size
        <input
          type="range"
          min={MIN_PATTERN_SIZE}
          max={MAX_PATTERN_SIZE}
          step={0.05}
          value={patternSize}
          onChange={(event) => setPatternSize(event.currentTarget.valueAsNumber)}
          className="w-40 accent-sky-500"
        />
      </label>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          aria-pressed={showOriginal}
          onClick={() => setShowOriginal((current) => !current)}
          className={showOriginal ? ACTIVE_BUTTON : SECONDARY_BUTTON}
        >
          Show original
        </button>
        <button type="button" onClick={reset} className={SECONDARY_BUTTON}>
          Reset
        </button>
        <button type="button" onClick={onChoosePhoto} className={SECONDARY_BUTTON}>
          Choose another photo
        </button>
      </div>
    </div>
  );
}
