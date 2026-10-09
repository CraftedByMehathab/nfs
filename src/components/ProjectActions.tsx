"use client";

import { useState } from "react";
import { ACTIVE_BUTTON, SECONDARY_BUTTON, TEXT_LINK } from "@/components/buttonStyles";
import { SignInDialog } from "@/components/SignInDialog";
import { useSession } from "@/components/useSession";
import { saveRender, type ProjectSnapshot, type SavedRender } from "@/lib/projects/save";
import { sharePageUrl, shareRender } from "@/lib/projects/share";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "working"; label: string }
  | { kind: "saved" }
  | { kind: "shared"; url: string; copied: boolean }
  | { kind: "error"; message: string };

type ProjectActionsProps = {
  /** Captures the picture on screen; null if it cannot be captured. */
  getSnapshot: () => Promise<ProjectSnapshot | null>;
  /** Changes whenever the picture on screen does, so the same picture is not saved twice. */
  signature: string;
  /** The saved picture being edited, which saving replaces; null for a new photo. */
  editing: SavedRender | null;
};

/** Save and Share for the picture on screen. Both need an account. */
export function ProjectActions({ getSnapshot, signature, editing }: ProjectActionsProps) {
  const { user } = useSession();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [signingIn, setSigningIn] = useState(false);
  // The project this photo was saved as, and the last render saved from it.
  const [saved, setSaved] = useState<(SavedRender & { signature: string; picture: Blob }) | null>(null);

  if (!supabaseConfigured) return null;

  /** Saves the picture on screen unless that exact picture is already saved. */
  async function ensureSaved(): Promise<(SavedRender & { picture: Blob }) | null> {
    const supabase = getSupabase();
    if (!supabase || !user) return null;
    if (saved && saved.signature === signature) return saved;
    const snapshot = await getSnapshot();
    if (!snapshot) throw new Error("The picture is not ready yet.");
    const projectId = saved?.projectId ?? editing?.projectId ?? null;
    const result = await saveRender(supabase, user.id, snapshot, projectId, editing?.renderId ?? null);
    const next = { ...result, signature, picture: snapshot.render };
    setSaved(next);
    return next;
  }

  async function run(label: string, action: () => Promise<Status>): Promise<void> {
    if (!user) {
      setSigningIn(true);
      return;
    }
    setStatus({ kind: "working", label });
    try {
      setStatus(await action());
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  const save = () =>
    run("Saving…", async () => {
      await ensureSaved();
      return { kind: "saved" };
    });

  const share = () =>
    run("Sharing…", async () => {
      const supabase = getSupabase();
      const render = await ensureSaved();
      if (!supabase || !render) throw new Error("You are signed out.");
      const slug = await shareRender(supabase, render.renderId, render.picture);
      return { kind: "shared", url: sharePageUrl(slug), copied: false };
    });

  async function copyLink(url: string): Promise<void> {
    await navigator.clipboard.writeText(url);
    setStatus({ kind: "shared", url, copied: true });
  }

  const working = status.kind === "working";

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex gap-3">
        <button type="button" onClick={save} disabled={working} className={ACTIVE_BUTTON}>
          Save
        </button>
        <button type="button" onClick={share} disabled={working} className={SECONDARY_BUTTON}>
          Share
        </button>
      </div>
      <div role="status" className="flex min-h-5 flex-wrap items-center justify-center gap-2 text-sm">
        {status.kind === "working" && status.label}
        {status.kind === "saved" && "Saved to your projects."}
        {status.kind === "error" && <span className="text-red-600 dark:text-red-400">{status.message}</span>}
        {status.kind === "shared" && (
          <>
            <a href={status.url} target="_blank" rel="noreferrer" className="break-all underline">
              {status.url}
            </a>
            <button type="button" onClick={() => copyLink(status.url)} className={TEXT_LINK}>
              {status.copied ? "Copied" : "Copy link"}
            </button>
          </>
        )}
      </div>
      <SignInDialog open={signingIn && !user} onClose={() => setSigningIn(false)} />
    </div>
  );
}
