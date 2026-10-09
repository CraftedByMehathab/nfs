"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/components/useSession";

/**
 * Where Google sends the browser after sign-in. Loading it finishes the
 * sign-in; the tab the user came from picks the session up on its own.
 */
export function SignInComplete() {
  const { user, ready } = useSession();

  useEffect(() => {
    // Only a window that a script opened (the Google popup) is allowed to close itself.
    if (user && window.opener) window.close();
  }, [user]);

  if (!ready) return <p>Signing you in…</p>;

  if (!user) {
    return (
      <>
        <h1 className="text-xl font-semibold">Sign-in did not finish</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Close this window, go back to NextFloor and try signing in again.
        </p>
        <Link href="/" className="text-sm font-medium underline">
          Back to NextFloor
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">You are signed in</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as {user.email}. You can close this window and go back to your picture.
      </p>
      <Link href="/" className="text-sm font-medium underline">
        Open NextFloor here
      </Link>
    </>
  );
}
