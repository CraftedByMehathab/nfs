"use client";

import { useEffect, useRef, useState } from "react";
import { ACTIVE_BUTTON, TEXT_LINK } from "@/components/buttonStyles";
import { getSupabase } from "@/lib/supabase/client";

type SignInDialogProps = {
  open: boolean;
  onClose: () => void;
};

/** Where Google sends the browser back to. */
function completionUrl(): string {
  return `${window.location.origin}/auth/complete`;
}

/**
 * Sign-in with Google. It finishes in a popup, so the page the user is working
 * on, and their unsaved picture, stay as they are.
 */
export function SignInDialog({ open, onClose }: SignInDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function continueWithGoogle(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    setError(null);
    // Open the window first, while still inside the click, or browsers block it.
    const popup = window.open("", "nextfloor-sign-in", "width=480,height=640");
    const { data, error: failure } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: completionUrl(), skipBrowserRedirect: true },
    });
    if (failure || !data.url) {
      popup?.close();
      setError(failure?.message ?? "Google sign-in is unavailable.");
      return;
    }
    if (popup) popup.location.href = data.url;
    else window.open(data.url, "_blank");
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="sign-in-title"
      className="m-auto w-[min(92vw,24rem)] rounded-2xl bg-background p-6 text-foreground shadow-xl backdrop:bg-black/60"
    >
      <h2 id="sign-in-title" className="text-lg font-semibold">
        Sign in to save and share
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Your picture stays open here while you sign in.
      </p>

      <button type="button" onClick={continueWithGoogle} className={`${ACTIVE_BUTTON} mt-5 w-full`}>
        Continue with Google
      </button>

      <p role="status" className="mt-3 min-h-5 text-sm text-red-600 dark:text-red-400">
        {error}
      </p>

      <button type="button" onClick={onClose} className={TEXT_LINK}>
        Close
      </button>
    </dialog>
  );
}
