"use client";

import { ACTIVE_BUTTON, SECONDARY_BUTTON } from "@/components/buttonStyles";

type EditorActionsProps = {
  detecting: boolean;
  onDetect: () => void;
  brushing: boolean;
  onToggleBrush: () => void;
  /** True when the outline is a detected or painted mask. */
  hasMask: boolean;
  onOutlineByHand: () => void;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  onReset: () => void;
  onChoosePhoto: () => void;
};

export function EditorActions({
  detecting,
  onDetect,
  brushing,
  onToggleBrush,
  hasMask,
  onOutlineByHand,
  showOriginal,
  onToggleOriginal,
  onReset,
  onChoosePhoto,
}: EditorActionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" onClick={onDetect} disabled={detecting} className={SECONDARY_BUTTON}>
        {detecting ? "Detecting…" : "Detect floor"}
      </button>
      <button
        type="button"
        aria-pressed={brushing}
        onClick={onToggleBrush}
        className={brushing ? ACTIVE_BUTTON : SECONDARY_BUTTON}
      >
        Brush
      </button>
      {hasMask && (
        <button type="button" onClick={onOutlineByHand} className={SECONDARY_BUTTON}>
          Outline by hand
        </button>
      )}
      <button
        type="button"
        aria-pressed={showOriginal}
        onClick={onToggleOriginal}
        className={showOriginal ? ACTIVE_BUTTON : SECONDARY_BUTTON}
      >
        Show original
      </button>
      <button type="button" onClick={onReset} className={SECONDARY_BUTTON}>
        Reset
      </button>
      <button type="button" onClick={onChoosePhoto} className={SECONDARY_BUTTON}>
        Choose another photo
      </button>
    </div>
  );
}
