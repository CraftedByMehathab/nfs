"use client";

import { useState } from "react";
import { FloorEditor } from "@/components/FloorEditor";
import { ImageSourcePicker } from "@/components/ImageSourcePicker";

export function Visualizer() {
  const [photo, setPhoto] = useState<ImageBitmap | null>(null);

  function replacePhoto(next: ImageBitmap | null): void {
    photo?.close();
    setPhoto(next);
  }

  if (!photo) {
    return <ImageSourcePicker onImage={replacePhoto} />;
  }

  return <FloorEditor photo={photo} onChoosePhoto={() => replacePhoto(null)} />;
}
