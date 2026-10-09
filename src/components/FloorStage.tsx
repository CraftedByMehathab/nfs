"use client";

import { useMemo, type Ref } from "react";
import { CompareSlider } from "@/components/CompareSlider";
import type { FinishSettings } from "@/components/FinishControls";
import { FloorCanvas, type FloorCanvasHandle } from "@/components/FloorCanvas";
import { MaskBrush } from "@/components/MaskBrush";
import { SelectionEditor } from "@/components/SelectionEditor";
import type { FloorSelection } from "@/components/useFloorSelection";
import { ZoomViewport } from "@/components/ZoomViewport";
import { isConvexQuad } from "@/lib/geometry/homography";
import type { BrushMode } from "@/lib/image/mask";
import { getTemplateTexture } from "@/lib/templates";

export type BrushSettings = {
  on: boolean;
  mode: BrushMode;
  /** Diameter in photo pixels. */
  size: number;
};

type FloorStageProps = {
  ref: Ref<FloorCanvasHandle>;
  photo: ImageBitmap;
  selection: FloorSelection;
  finish: FinishSettings;
  brush: BrushSettings;
  /** Before/after divider position, or null when not comparing. */
  split: number | null;
  onSplitChange: (split: number) => void;
};

/** The picture and everything drawn over it: points, brush or the compare divider. */
export function FloorStage({
  ref,
  photo,
  selection,
  finish,
  brush,
  split,
  onSplitChange,
}: FloorStageProps) {
  const { perspective, outline, mask } = selection;
  const aspectRatio = photo.width / photo.height;
  const repeats = finish.template.scale / finish.patternSize;
  const tiles = useMemo(() => [repeats, repeats] as const, [repeats]);
  const editing = split === null;

  return (
    <ZoomViewport aspectRatio={aspectRatio}>
      <SelectionEditor
        perspective={perspective}
        outline={outline}
        layer={selection.layer}
        maskIsImage={mask !== null}
        onPerspectiveChange={selection.setPerspective}
        onOutlineChange={selection.setOutline}
        aspectRatio={aspectRatio}
        perspectiveInvalid={!isConvexQuad(perspective)}
        pointsVisible={editing && !brush.on}
      >
        <FloorCanvas
          ref={ref}
          photo={photo}
          perspective={perspective}
          outline={outline ?? perspective}
          maskImage={mask}
          maskVersion={selection.maskVersion}
          floorTexture={getTemplateTexture(finish.template)}
          tiles={tiles}
          split={split ?? 0}
          shading={finish.shading}
        />
        {editing && brush.on && mask && (
          <MaskBrush
            mask={mask}
            mode={brush.mode}
            size={brush.size}
            onPaint={selection.markMaskChanged}
          />
        )}
        {split !== null && <CompareSlider value={split} onChange={onSplitChange} />}
      </SelectionEditor>
    </ZoomViewport>
  );
}
