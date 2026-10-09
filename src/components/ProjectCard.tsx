"use client";

import { useState } from "react";
import Image from "next/image";
import { downloadBlob } from "@/lib/image/download";
import { deleteRender, downloadRender, type SavedRenderItem } from "@/lib/projects/list";
import { sharePageUrl, shareRender, unshareRender } from "@/lib/projects/share";
import { getSupabase, type AppSupabaseClient } from "@/lib/supabase/client";

const ACTION = "text-sm font-medium underline disabled:opacity-50";

type ProjectCardProps = {
  item: SavedRenderItem;
  /** Called after the item is shared, unshared or deleted. */
  onChanged: () => void | Promise<void>;
};

export function ProjectCard({ item, onChanged }: ProjectCardProps) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function run(action: (supabase: AppSupabaseClient) => Promise<string | null>): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    try {
      setNote(await action(supabase));
      await onChanged();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const share = () =>
    run(async (supabase) => {
      const picture = await downloadRender(supabase, item.imagePath);
      const slug = await shareRender(supabase, item.id, picture);
      await navigator.clipboard.writeText(sharePageUrl(slug)).catch(() => undefined);
      return "Shared. The link is copied.";
    });

  const copyLink = (slug: string) =>
    run(async () => {
      await navigator.clipboard.writeText(sharePageUrl(slug));
      return "Link copied.";
    });

  const stopSharing = (slug: string) =>
    run(async (supabase) => {
      await unshareRender(supabase, item.id, slug);
      return "No longer shared.";
    });

  const download = () =>
    run(async (supabase) => {
      downloadBlob(await downloadRender(supabase, item.imagePath), `nextfloor-${item.id.slice(0, 8)}.jpg`);
      return null;
    });

  const remove = () =>
    run(async (supabase) => {
      await deleteRender(supabase, item);
      return null;
    });

  return (
    <li className="flex flex-col gap-2">
      <Image
        src={item.imageUrl}
        alt={`Saved picture with the ${item.templateName} finish`}
        width={item.width}
        height={item.height}
        unoptimized
        className="h-auto w-full rounded-lg"
      />
      <p className="text-sm">
        <span className="font-medium">{item.templateName}</span>
        <span className="text-zinc-600 dark:text-zinc-400">
          {" · "}
          {new Date(item.createdAt).toLocaleDateString()}
          {item.shareSlug && " · Shared"}
        </span>
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {item.shareSlug ? (
          <>
            <button type="button" disabled={busy} onClick={() => copyLink(item.shareSlug ?? "")} className={ACTION}>
              Copy link
            </button>
            <button type="button" disabled={busy} onClick={() => stopSharing(item.shareSlug ?? "")} className={ACTION}>
              Stop sharing
            </button>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={share} className={ACTION}>
            Share
          </button>
        )}
        <button type="button" disabled={busy} onClick={download} className={ACTION}>
          Download
        </button>
        <button type="button" disabled={busy} onClick={remove} className={`${ACTION} text-red-600 dark:text-red-400`}>
          Delete
        </button>
      </div>
      {note && <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">{note}</p>}
    </li>
  );
}
