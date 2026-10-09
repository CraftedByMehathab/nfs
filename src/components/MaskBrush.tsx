"use client";

import { useRef, useState, type PointerEvent } from "react";
import { paintStroke, type BrushMode } from "@/lib/image/mask";
import type { Point } from "@/types/geometry";

// A touch must travel this far (CSS pixels) before it paints, so that a second
// finger landing for a two-finger pan does not leave a dab behind.
const TOUCH_SLOP = 4;

type MaskBrushProps = {
  /** The mask being edited; painted on directly. */
  mask: HTMLCanvasElement;
  mode: BrushMode;
  /** Brush diameter in mask pixels. */
  size: number;
  /** Called after every change to the mask, so the picture can be redrawn. */
  onPaint: () => void;
};

/**
 * A transparent layer over the picture that paints floor in or out of the mask.
 * One pointer paints; two fingers pan the zoomed picture instead.
 */
export function MaskBrush({ mask, mode, size, onPaint }: MaskBrushProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  // Every pointer currently down, by id, at its last client position.
  const pointers = useRef(new Map<number, Point>());
  const lastPixel = useRef<Point | null>(null);
  // A touch that has landed but not yet moved far enough to count as painting.
  const pendingTouch = useRef<Point | null>(null);
  const [cursor, setCursor] = useState<{ css: Point; diameter: number } | null>(null);

  function toPixel(client: Point): { pixel: Point; css: Point; scale: number } | null {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const css = { x: client.x - rect.left, y: client.y - rect.top };
    return {
      css,
      pixel: { x: (css.x / rect.width) * mask.width, y: (css.y / rect.height) * mask.height },
      scale: rect.width / mask.width,
    };
  }

  function paintAt(client: Point): void {
    const located = toPixel(client);
    if (!located) return;
    paintStroke(mask, lastPixel.current ?? located.pixel, located.pixel, size, mode);
    lastPixel.current = located.pixel;
    onPaint();
  }

  function stopPainting(): void {
    lastPixel.current = null;
    pendingTouch.current = null;
  }

  function down(event: PointerEvent<HTMLDivElement>): void {
    const client = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, client);
    if (pointers.current.size > 1) {
      stopPainting();
    } else if (event.pointerType === "touch") {
      pendingTouch.current = client;
    } else {
      paintAt(client);
    }
  }

  function move(event: PointerEvent<HTMLDivElement>): void {
    const client = { x: event.clientX, y: event.clientY };
    const previous = pointers.current.get(event.pointerId);
    const located = toPixel(client);
    if (located) setCursor({ css: located.css, diameter: size * located.scale });
    if (!previous) return;
    pointers.current.set(event.pointerId, client);

    if (pointers.current.size > 1) {
      // Each of the two fingers reports its own movement, so apply half of each.
      const viewport = layerRef.current?.closest<HTMLElement>("[data-zoom-viewport]");
      viewport?.scrollBy((previous.x - client.x) / 2, (previous.y - client.y) / 2);
      return;
    }
    const start = pendingTouch.current;
    if (start) {
      if (Math.hypot(client.x - start.x, client.y - start.y) < TOUCH_SLOP) return;
      pendingTouch.current = null;
      paintAt(start);
    }
    if (lastPixel.current) paintAt(client);
  }

  function up(event: PointerEvent<HTMLDivElement>): void {
    // A touch that never moved is a tap: paint a single dab.
    if (pendingTouch.current && pointers.current.size === 1) paintAt(pendingTouch.current);
    pointers.current.delete(event.pointerId);
    stopPainting();
  }

  return (
    <div
      ref={layerRef}
      role="application"
      aria-label={mode === "add" ? "Paint to add floor" : "Paint to erase floor"}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
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
