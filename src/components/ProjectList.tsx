"use client";

import { useCallback, useEffect, useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { useSession } from "@/components/useSession";
import { listRenders, type SavedRenderItem } from "@/lib/projects/list";
import { getSupabase } from "@/lib/supabase/client";

const NOTE = "text-sm text-zinc-600 dark:text-zinc-400";

type LoadResult = { items: SavedRenderItem[] | null; error: string | null };

async function load(): Promise<LoadResult> {
  const supabase = getSupabase();
  if (!supabase) return { items: [], error: null };
  try {
    return { items: await listRenders(supabase), error: null };
  } catch (cause) {
    return {
      items: null,
      error: cause instanceof Error ? cause.message : "Could not load your pictures.",
    };
  }
}

/** The signed-in user's saved pictures. */
export function ProjectList() {
  const { user, ready } = useSession();
  const [result, setResult] = useState<LoadResult | null>(null);

  const reload = useCallback(() => load().then(setResult), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void load().then((loaded) => {
      if (!cancelled) setResult(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const items = result?.items ?? null;
  const error = result?.error ?? null;

  if (!ready) return <p className={NOTE}>Loading…</p>;
  if (!user) return <p className={NOTE}>Sign in from the home page to see your saved pictures.</p>;
  if (error) return <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!items) return <p className={NOTE}>Loading your pictures…</p>;
  if (items.length === 0) return <p className={NOTE}>Nothing saved yet. Save a picture from the editor.</p>;

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} onChanged={reload} />
      ))}
    </ul>
  );
}
