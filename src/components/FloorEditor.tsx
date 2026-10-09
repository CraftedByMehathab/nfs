"use client";

import { useMemo, useReducer, useState } from "react";
import { BrushControls } from "@/components/BrushControls";
import { EditorActions } from "@/components/EditorActions";
import { FinishControls, type FinishSettings } from "@/components/FinishControls";
import { FloorCanvas } from "@/components/FloorCanvas";
import { MaskBrush } from "@/components/MaskBrush";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { SelectionEditor, type SelectionLayer } from "@/components/SelectionEditor";
import { selectionHint } from "@/components/selectionHint";
import { useFloorDetection } from "@/components/useFloorDetection";
import { ZoomViewport } from "@/components/ZoomViewport";
import { isConvexQuad } from "@/lib/geometry/homography";
import { DEFAULT_QUAD } from "@/lib/geometry/quad";
import { drawPolygonMask, type BrushMode } from "@/lib/image/mask";
import { getTemplateTexture, TEMPLATES } from "@/lib/templates";
import type { Polygon, Quad } from "@/types/geometry";

const LAYERS: readonly { id: SelectionLayer; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "perspective", label: "Perspective" },
];

type FloorEditorProps = {
  photo: ImageBitmap;
  onChoosePhoto: () => void;
};

export function FloorEditor({ photo, onChoosePhoto }: FloorEditorProps) {
  const [perspective, setPerspective] = useState<Quad>(DEFAULT_QUAD);
  // Null until a point is added; until then the outline is the perspective corners.
  const [outline, setOutline] = useState<Polygon | null>(null);
  const [layer, setLayer] = useState<SelectionLayer>("outline");
  // A detected or painted mask. While set, it replaces the polygon outline.
  const [mask, setMask] = useState<HTMLCanvasElement | null>(null);
  const [maskVersion, markMaskChanged] = useReducer((version: number) => version + 1, 0);
  const [brushing, setBrushing] = useState(false);
  const [brushMode, setBrushMode] = useState<BrushMode>("add");
  const [brushSize, setBrushSize] = useState(60);
  const [finish, setFinish] = useState<FinishSettings>({
    template: TEMPLATES[0],
    patternSize: 1,
    shading: 0.8,
  });
  const [showOriginal, setShowOriginal] = useState(false);
  const detection = useFloorDetection(photo);

  const detecting = detection.state.status === "running";
  const perspectiveValid = isConvexQuad(perspective);
  const repeats = finish.template.scale / finish.patternSize;
  const tiles = useMemo(() => [repeats, repeats] as const, [repeats]);
  const warn = !showOriginal && !brushing && !detecting && !perspectiveValid;

  async function detectFloor(): Promise<void> {
    const found = await detection.detect();
    if (!found?.mask) return;
    setMask(found.mask);
    markMaskChanged();
    if (found.corners) setPerspective(found.corners);
  }

  function toggleBrush(): void {
    if (!brushing && !mask) {
      // Start painting from the current outline.
      const canvas = document.createElement("canvas");
      drawPolygonMask(canvas, outline ?? perspective, photo);
      setMask(canvas);
    }
    setBrushing((current) => !current);
  }

  function outlineByHand(): void {
    setMask(null);
    setBrushing(false);
    detection.clear();
  }

  function reset(): void {
    outlineByHand();
    setPerspective(DEFAULT_QUAD);
    setOutline(null);
    setLayer("outline");
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <ZoomViewport aspectRatio={photo.width / photo.height}>
        <SelectionEditor
          perspective={perspective}
          outline={outline}
          layer={layer}
          maskIsImage={mask !== null}
          onPerspectiveChange={setPerspective}
          onOutlineChange={setOutline}
          aspectRatio={photo.width / photo.height}
          perspectiveInvalid={!perspectiveValid}
          pointsVisible={!showOriginal && !brushing}
        >
          <FloorCanvas
            photo={photo}
            perspective={perspective}
            outline={outline ?? perspective}
            maskImage={mask}
            maskVersion={maskVersion}
            floorTexture={getTemplateTexture(finish.template)}
            tiles={tiles}
            opacity={showOriginal ? 0 : 1}
            shading={finish.shading}
          />
          {brushing && mask && !showOriginal && (
            <MaskBrush mask={mask} mode={brushMode} size={brushSize} onPaint={markMaskChanged} />
          )}
        </SelectionEditor>
      </ZoomViewport>
      {brushing && !showOriginal && (
        <BrushControls
          mode={brushMode}
          onModeChange={setBrushMode}
          size={brushSize}
          onSizeChange={setBrushSize}
        />
      )}
      {outline && !mask && !showOriginal && (
        <SegmentedToggle label="Points to edit" options={LAYERS} value={layer} onChange={setLayer} />
      )}
      <p
        role="status"
        className={`text-center text-sm ${
          warn ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {selectionHint({
          showOriginal,
          brushing,
          perspectiveValid,
          detection: detection.state,
          maskIsImage: mask !== null,
          customOutline: outline !== null,
          layer,
        })}
      </p>
      <FinishControls value={finish} onChange={setFinish} />
      <EditorActions
        detecting={detecting}
        onDetect={detectFloor}
        brushing={brushing}
        onToggleBrush={toggleBrush}
        hasMask={mask !== null}
        onOutlineByHand={outlineByHand}
        showOriginal={showOriginal}
        onToggleOriginal={() => setShowOriginal((current) => !current)}
        onReset={reset}
        onChoosePhoto={onChoosePhoto}
      />
    </div>
  );
}
