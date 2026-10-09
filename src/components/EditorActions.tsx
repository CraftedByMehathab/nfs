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
  comparing: boolean;
  onToggleCompare: () => void;
  onDownload: () => void;
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
  comparing,
  onToggleCompare,
  onDownload,
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
        aria-pressed={comparing}
        onClick={onToggleCompare}
        className={comparing ? ACTIVE_BUTTON : SECONDARY_BUTTON}
      >
        Compare
      </button>
      <button type="button" onClick={onDownload} className={SECONDARY_BUTTON}>
        Download
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
