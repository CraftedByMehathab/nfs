"use client";

import { useEffect, useRef, useState } from "react";
import { resizeToBitmap } from "@/lib/image/resize";

type Status = "starting" | "ready" | "failed";

type CameraCaptureProps = {
  onCapture: (photo: ImageBitmap) => void;
  onCancel: () => void;
};

function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("starting");

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      })
      .then((started) => {
        if (cancelled) {
          stopStream(started);
          return;
        }
        stream = started;
        if (videoRef.current) videoRef.current.srcObject = started;
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      if (stream) stopStream(stream);
    };
  }, []);

  async function capture(): Promise<void> {
    const video = videoRef.current;
    if (!video) return;
    try {
      onCapture(await resizeToBitmap(video));
    } catch {
      setStatus("failed");
    }
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          The camera is unavailable. Check the camera permission, or upload a
          photo instead.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium dark:border-white/20"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onCanPlay={() => setStatus("ready")}
        className="max-h-[70vh] w-full rounded-lg bg-black object-contain"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={capture}
          disabled={status !== "ready"}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          Take photo
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium dark:border-white/20"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
