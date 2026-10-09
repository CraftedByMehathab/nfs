"use client";

import { useRef, useState } from "react";
import { BrushControls } from "@/components/BrushControls";
import { EditorActions } from "@/components/EditorActions";
import { FinishControls, type FinishSettings } from "@/components/FinishControls";
import type { FloorCanvasHandle } from "@/components/FloorCanvas";
import { FloorStage, type BrushSettings } from "@/components/FloorStage";
import { ProjectActions } from "@/components/ProjectActions";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import type { SelectionLayer } from "@/components/SelectionEditor";
import { selectionHint } from "@/components/selectionHint";
import { useFloorSelection } from "@/components/useFloorSelection";
import { isConvexQuad } from "@/lib/geometry/homography";
import { downloadBlob } from "@/lib/image/download";
import type { OpenedProject } from "@/lib/projects/open";
import type { ProjectSnapshot } from "@/lib/projects/save";
import { TEMPLATES } from "@/lib/templates";

const LAYERS: readonly { id: SelectionLayer; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "perspective", label: "Perspective" },
];

type FloorEditorProps = {
  photo: ImageBitmap;
  /** The saved picture being edited, when the photo came from one. */
  initial?: OpenedProject;
  onChoosePhoto: () => void;
};

export function FloorEditor({ photo, initial, onChoosePhoto }: FloorEditorProps) {
  const selection = useFloorSelection(photo, initial);
  const canvas = useRef<FloorCanvasHandle>(null);
  const [brush, setBrush] = useState<BrushSettings>({ on: false, mode: "add", size: 60 });
  const [comparing, setComparing] = useState(false);
  // Before/after divider position; the original photo shows left of it.
  const [split, setSplit] = useState(0.5);
  const [finish, setFinish] = useState<FinishSettings>({
    template: TEMPLATES.find(({ id }) => id === initial?.templateId) ?? TEMPLATES[0],
    patternSize: initial?.patternSize ?? 1,
    shading: initial?.shading ?? 0.8,
  });

  const { perspective, outline, mask } = selection;
  const perspectiveValid = isConvexQuad(perspective);
  const editing = !comparing;
  const brushing = brush.on;
  const warn = editing && !brushing && !selection.detecting && !perspectiveValid;
  // Identifies the picture on screen, so saving twice without a change stores it once.
  const signature = JSON.stringify([finish, perspective, outline, selection.maskVersion, mask !== null]);

  function toggleBrush(): void {
    if (!brushing) selection.ensureMask();
    setBrush({ ...brush, on: !brushing });
  }

  function stopBrushing(): void {
    setBrush((current) => ({ ...current, on: false }));
  }

  async function download(): Promise<void> {
    const blob = await canvas.current?.capture();
    if (blob) downloadBlob(blob, `nextfloor-${finish.template.id}.jpg`);
  }

  async function getSnapshot(): Promise<ProjectSnapshot | null> {
    const render = await canvas.current?.capture();
    if (!render) return null;
    return {
      photo,
      perspective,
      outline,
      mask,
      templateId: finish.template.id,
      patternSize: finish.patternSize,
      shading: finish.shading,
      render,
    };
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <FloorStage
        ref={canvas}
        photo={photo}
        selection={selection}
        finish={finish}
        brush={brush}
        split={comparing ? split : null}
        onSplitChange={setSplit}
      />
      {editing && brushing && (
        <BrushControls
          mode={brush.mode}
          onModeChange={(mode) => setBrush({ ...brush, mode })}
          size={brush.size}
          onSizeChange={(size) => setBrush({ ...brush, size })}
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
        onOutlineByHand={() => {
          selection.clearMask();
          stopBrushing();
        }}
        comparing={comparing}
        onToggleCompare={() => setComparing((current) => !current)}
        onDownload={download}
        onReset={() => {
          selection.reset();
          stopBrushing();
        }}
        onChoosePhoto={onChoosePhoto}
      />
      <ProjectActions getSnapshot={getSnapshot} signature={signature} editing={initial ?? null} />
    </div>
  );
}
