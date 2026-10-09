"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInDialog } from "@/components/SignInDialog";
import { useSession } from "@/components/useSession";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";

const LINK = "text-sm font-medium underline-offset-4 hover:underline";

/** Sign-in state in the page header: a sign-in button, or the account and its links. */
export function AccountMenu() {
  const { user, ready } = useSession();
  const [signingIn, setSigningIn] = useState(false);

  // Accounts are optional: without a Supabase project the editor still works.
  if (!supabaseConfigured || !ready) return null;

  if (!user) {
    return (
      <>
        <button type="button" onClick={() => setSigningIn(true)} className={LINK}>
          Sign in
        </button>
        <SignInDialog open={signingIn} onClose={() => setSigningIn(false)} />
      </>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/projects" className={LINK}>
        My projects
      </Link>
      <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">{user.email}</span>
      <button
        type="button"
        onClick={() => {
          // Otherwise the dialog that was open at sign-in reappears on sign-out.
          setSigningIn(false);
          void getSupabase()?.auth.signOut();
        }}
        className={LINK}
      >
        Sign out
      </button>
    </div>
  );
}
