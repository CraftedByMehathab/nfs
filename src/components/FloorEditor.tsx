"use client";

import { useMemo, useRef, useState } from "react";
import { BrushControls } from "@/components/BrushControls";
import { CompareSlider } from "@/components/CompareSlider";
import { EditorActions } from "@/components/EditorActions";
import { FinishControls, type FinishSettings } from "@/components/FinishControls";
import { FloorCanvas, type FloorCanvasHandle } from "@/components/FloorCanvas";
import { MaskBrush } from "@/components/MaskBrush";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { SelectionEditor, type SelectionLayer } from "@/components/SelectionEditor";
import { selectionHint } from "@/components/selectionHint";
import { useFloorSelection } from "@/components/useFloorSelection";
import { ZoomViewport } from "@/components/ZoomViewport";
import { isConvexQuad } from "@/lib/geometry/homography";
import { downloadBlob } from "@/lib/image/download";
import type { BrushMode } from "@/lib/image/mask";
import { getTemplateTexture, TEMPLATES } from "@/lib/templates";

const LAYERS: readonly { id: SelectionLayer; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "perspective", label: "Perspective" },
];

type FloorEditorProps = {
  photo: ImageBitmap;
  onChoosePhoto: () => void;
};

export function FloorEditor({ photo, onChoosePhoto }: FloorEditorProps) {
  const selection = useFloorSelection(photo);
  const canvas = useRef<FloorCanvasHandle>(null);
  const [brushing, setBrushing] = useState(false);
  const [brushMode, setBrushMode] = useState<BrushMode>("add");
  const [brushSize, setBrushSize] = useState(60);
  const [comparing, setComparing] = useState(false);
  // Before/after divider position; the original photo shows left of it.
  const [split, setSplit] = useState(0.5);
  const [finish, setFinish] = useState<FinishSettings>({
    template: TEMPLATES[0],
    patternSize: 1,
    shading: 0.8,
  });

  const { perspective, outline, mask } = selection;
  const perspectiveValid = isConvexQuad(perspective);
  const repeats = finish.template.scale / finish.patternSize;
  const tiles = useMemo(() => [repeats, repeats] as const, [repeats]);
  const editing = !comparing;
  const warn = editing && !brushing && !selection.detecting && !perspectiveValid;

  function toggleBrush(): void {
    if (!brushing) selection.ensureMask();
    setBrushing((current) => !current);
  }

  function outlineByHand(): void {
    selection.clearMask();
    setBrushing(false);
  }

  async function download(): Promise<void> {
    const blob = await canvas.current?.capture();
    if (blob) downloadBlob(blob, `nextfloor-${finish.template.id}.jpg`);
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <ZoomViewport aspectRatio={photo.width / photo.height}>
        <SelectionEditor
          perspective={perspective}
          outline={outline}
          layer={selection.layer}
          maskIsImage={mask !== null}
          onPerspectiveChange={selection.setPerspective}
          onOutlineChange={selection.setOutline}
          aspectRatio={photo.width / photo.height}
          perspectiveInvalid={!perspectiveValid}
          pointsVisible={editing && !brushing}
        >
          <FloorCanvas
            ref={canvas}
            photo={photo}
            perspective={perspective}
            outline={outline ?? perspective}
            maskImage={mask}
            maskVersion={selection.maskVersion}
            floorTexture={getTemplateTexture(finish.template)}
            tiles={tiles}
            split={comparing ? split : 0}
            shading={finish.shading}
          />
          {editing && brushing && mask && (
            <MaskBrush
              mask={mask}
              mode={brushMode}
              size={brushSize}
              onPaint={selection.markMaskChanged}
            />
          )}
          {comparing && <CompareSlider value={split} onChange={setSplit} />}
        </SelectionEditor>
      </ZoomViewport>
      {editing && brushing && (
        <BrushControls
          mode={brushMode}
          onModeChange={setBrushMode}
          size={brushSize}
          onSizeChange={setBrushSize}
        />
      )}
      {editing && outline && !mask && (
        <SegmentedToggle
          label="Points to edit"
          options={LAYERS}
          value={selection.layer}
          onChange={selection.setLayer}
        />
      )}
      <p
        role="status"
        className={`text-center text-sm ${
          warn ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {selectionHint({
          comparing,
          brushing,
          perspectiveValid,
          detection: selection.detection,
          maskIsImage: mask !== null,
          customOutline: outline !== null,
          layer: selection.layer,
        })}
      </p>
      <FinishControls value={finish} onChange={setFinish} />
      <EditorActions
        detecting={selection.detecting}
        onDetect={selection.detectFloor}
        brushing={brushing}
        onToggleBrush={toggleBrush}
        hasMask={mask !== null}
        onOutlineByHand={outlineByHand}
        comparing={comparing}
        onToggleCompare={() => setComparing((current) => !current)}
        onDownload={download}
        onReset={() => {
          selection.reset();
          setBrushing(false);
        }}
        onChoosePhoto={onChoosePhoto}
      />
    </div>
  );
}
