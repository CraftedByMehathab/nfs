"use client";

import { useRef, useState, type PointerEvent } from "react";
import { paintStroke, type BrushMode } from "@/lib/image/mask";
import type { Point } from "@/types/geometry";

type Located = {
  /** Pointer position in mask pixels. */
  pixel: Point;
  /** Pointer position in CSS pixels, relative to the layer. */
  css: Point;
  /** CSS pixels per mask pixel. */
  scale: number;
};

type MaskBrushProps = {
  /** The mask being edited; painted on directly. */
  mask: HTMLCanvasElement;
  mode: BrushMode;
  /** Brush diameter in mask pixels. */
  size: number;
  /** Called after every change to the mask, so the picture can be redrawn. */
  onPaint: () => void;
};

/** A transparent layer over the picture that paints floor in or out of the mask. */
export function MaskBrush({ mask, mode, size, onPaint }: MaskBrushProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const lastPixel = useRef<Point | null>(null);
  const [cursor, setCursor] = useState<{ css: Point; diameter: number } | null>(null);

  function locate(event: PointerEvent): Located | null {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const css = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    return {
      css,
      pixel: { x: (css.x / rect.width) * mask.width, y: (css.y / rect.height) * mask.height },
      scale: rect.width / mask.width,
    };
  }

  function paintTo(event: PointerEvent, start: boolean): void {
    const located = locate(event);
    if (!located) return;
    setCursor({ css: located.css, diameter: size * located.scale });
    if (!start && !lastPixel.current) return;
    paintStroke(mask, lastPixel.current ?? located.pixel, located.pixel, size, mode);
    lastPixel.current = located.pixel;
    onPaint();
  }

  function begin(event: PointerEvent<HTMLDivElement>): void {
    event.currentTarget.setPointerCapture(event.pointerId);
    paintTo(event, true);
  }

  function end(): void {
    lastPixel.current = null;
  }

  return (
    <div
      ref={layerRef}
      role="application"
      aria-label={mode === "add" ? "Paint to add floor" : "Paint to erase floor"}
      onPointerDown={begin}
      onPointerMove={(event) => paintTo(event, false)}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={() => setCursor(null)}
      className="absolute inset-0 cursor-crosshair touch-none overflow-hidden rounded-lg"
    >
      {cursor && (
        <span
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
          style={{
            left: cursor.css.x,
            top: cursor.css.y,
            width: cursor.diameter,
            height: cursor.diameter,
          }}
        />
      )}
    </div>
  );
}
