"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SECONDARY_BUTTON } from "@/components/buttonStyles";
import { clampZoom, MAX_ZOOM, MIN_ZOOM, scrollAfterZoom, stepZoom } from "@/lib/geometry/zoom";
import type { Point } from "@/types/geometry";

// Room around the picture so handles on its very edge are not cut off.
const PADDING = 12;
const WHEEL_SPEED = 0.01;
const SMALL_BUTTON = `${SECONDARY_BUTTON} px-3! py-1!`;

type ZoomViewportProps = {
  /** Picture width divided by height. */
  aspectRatio: number;
  children: ReactNode;
};

/**
 * Shows its children in a fixed-size window that can be zoomed and scrolled.
 * Zoom with the buttons, or with pinch / Ctrl+scroll on the picture.
 */
export function ZoomViewport({ aspectRatio, children }: ZoomViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const previousZoom = useRef(zoom);
  // Where in the viewport the picture should stay still during the next zoom.
  const anchor = useRef<Point | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const ratio = zoom / previousZoom.current;
    previousZoom.current = zoom;
    if (!viewport || ratio === 1) return;
    const at = anchor.current ?? { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 };
    anchor.current = null;
    viewport.scrollLeft = scrollAfterZoom(viewport.scrollLeft, at.x, PADDING, ratio);
    viewport.scrollTop = scrollAfterZoom(viewport.scrollTop, at.y, PADDING, ratio);
  }, [zoom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    // Trackpad pinch arrives as a wheel event with ctrlKey set.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      anchor.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setZoom((current) => clampZoom(current * Math.exp(-event.deltaY * WHEEL_SPEED)));
    };
    // React registers wheel listeners as passive, which cannot call preventDefault.
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        ref={viewportRef}
        data-zoom-viewport
        className="overflow-auto [scrollbar-width:thin]"
        style={{
          aspectRatio,
          width: `min(100%, calc(70vh * ${aspectRatio}))`,
          // The padding sits outside the picture's own size and is cancelled by the margin.
          boxSizing: "content-box",
          padding: PADDING,
          margin: -PADDING,
        }}
      >
        <div style={{ width: `${zoom * 100}%` }}>{children}</div>
      </div>
      <div role="group" aria-label="Zoom" className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => setZoom((current) => stepZoom(current, "out"))}
          className={SMALL_BUTTON}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          disabled={zoom === 1}
          onClick={() => setZoom(1)}
          className={`${SMALL_BUTTON} w-16 tabular-nums`}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom((current) => stepZoom(current, "in"))}
          className={SMALL_BUTTON}
        >
          +
        </button>
      </div>
    </div>
  );
}
