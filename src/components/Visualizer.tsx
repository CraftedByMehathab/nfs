"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FloorEditor } from "@/components/FloorEditor";
import { ImageSourcePicker } from "@/components/ImageSourcePicker";
import { useOpenedProject } from "@/components/useOpenedProject";

const NOTE = "text-sm text-zinc-600 dark:text-zinc-400";

export function Visualizer() {
  const router = useRouter();
  // Set when a saved picture is being edited: /?render=<id>.
  const renderId = useSearchParams().get("render");
  const opened = useOpenedProject(renderId);
  const [photo, setPhoto] = useState<ImageBitmap | null>(null);

  function replacePhoto(next: ImageBitmap | null): void {
    photo?.close();
    setPhoto(next);
  }

  if (opened.status === "loading") {
    return <p role="status" className={NOTE}>Opening your picture…</p>;
  }

  if (opened.status === "failed") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p role="alert" className="text-center text-sm text-red-600 dark:text-red-400">{opened.message}</p>
        <Link href="/" className="text-sm font-medium underline">
          Start a new picture
        </Link>
      </div>
    );
  }

  if (opened.status === "ready") {
    return (
      <FloorEditor
        key={renderId}
        photo={opened.project.photo}
        initial={opened.project}
        onChoosePhoto={() => router.replace("/")}
      />
    );
  }

  if (!photo) {
    return <ImageSourcePicker onImage={replacePhoto} />;
  }

  return <FloorEditor photo={photo} onChoosePhoto={() => replacePhoto(null)} />;
}
