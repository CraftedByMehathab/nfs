"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";

type SessionState = {
  user: User | null;
  /** False until the stored session has been read, to avoid a signed-out flash. */
  ready: boolean;
};

/** The signed-in user, kept up to date as they sign in or out in any tab. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ user: null, ready: false });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      // Report "ready, signed out" on the next tick rather than during the effect.
      const timer = setTimeout(() => setState({ user: null, ready: true }));
      return () => clearTimeout(timer);
    }
    // Fires once straight away with the stored session, then on every change.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, ready: true });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
