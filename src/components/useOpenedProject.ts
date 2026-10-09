"use client";

import { useEffect, useState } from "react";
import { openRender, type OpenedProject } from "@/lib/projects/open";
import { getSupabase } from "@/lib/supabase/client";

export type OpenedProjectState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; project: OpenedProject }
  | { status: "failed"; message: string };

type Loaded = { renderId: string; project: OpenedProject | null; message: string };

/** Loads the saved picture `renderId` for the editor; idle while `renderId` is null. */
export function useOpenedProject(renderId: string | null): OpenedProjectState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!renderId) return;
    let cancelled = false;
    let photo: ImageBitmap | null = null;
    const supabase = getSupabase();
    const opening = supabase
      ? openRender(supabase, renderId)
      : Promise.reject(new Error("Saved pictures are not available here."));
    opening.then(
      (project) => {
        if (cancelled) {
          project.photo.close();
          return;
        }
        photo = project.photo;
        setLoaded({ renderId, project, message: "" });
      },
      (cause: unknown) => {
        if (cancelled) return;
        const message = cause instanceof Error ? cause.message : "Could not open the picture.";
        setLoaded({ renderId, project: null, message });
      },
    );
    return () => {
      cancelled = true;
      photo?.close();
    };
  }, [renderId]);

  if (!renderId) return { status: "idle" };
  // A result for a different picture is stale, and its photo is already closed.
  if (loaded?.renderId !== renderId) return { status: "loading" };
  if (!loaded.project) return { status: "failed", message: loaded.message };
  return { status: "ready", project: loaded.project };
}
