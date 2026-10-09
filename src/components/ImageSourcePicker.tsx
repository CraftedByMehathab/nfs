"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { decodeImageFile } from "@/lib/image/resize";

type ImageSourcePickerProps = {
  onImage: (photo: ImageBitmap) => void;
};

export function ImageSourcePicker({ onImage }: ImageSourcePickerProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      onImage(await decodeImageFile(file));
    } catch {
      setError("That file could not be read as an image. Try a JPEG or PNG.");
    } finally {
      setBusy(false);
    }
  }

  function openCamera(): void {
    setError(null);
    // mediaDevices only exists in a secure context; otherwise hand off to the OS camera.
    if ("mediaDevices" in navigator) {
      setCameraOpen(true);
    } else {
      nativeCameraRef.current?.click();
    }
  }

  if (cameraOpen) {
    return (
      <CameraCapture
        onCapture={(photo) => {
          setCameraOpen(false);
          onImage(photo);
        }}
        onCancel={() => setCameraOpen(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          disabled={busy}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {busy ? "Loading…" : "Upload photo"}
        </button>
        <button
          type="button"
          onClick={openCamera}
          disabled={busy}
          className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium disabled:opacity-50 dark:border-white/20"
        >
          Use camera
        </button>
      </div>
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
