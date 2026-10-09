"use client";

import { useCallback, useEffect, useState } from "react";
import { LeadCard } from "@/components/LeadCard";
import { useSession } from "@/components/useSession";
import { listLeads, type Lead } from "@/lib/contractors/leads";
import { getSupabase } from "@/lib/supabase/client";

const NOTE = "text-sm text-zinc-600 dark:text-zinc-400";

type LoadResult = { leads: Lead[] | null; error: string | null };

async function load(): Promise<LoadResult> {
  const supabase = getSupabase();
  if (!supabase) return { leads: [], error: null };
  try {
    return { leads: await listLeads(supabase), error: null };
  } catch (cause) {
    return {
      leads: null,
      error: cause instanceof Error ? cause.message : "Could not load your quote requests.",
    };
  }
}

/** The quote requests sent to the signed-in contractor. */
export function LeadList() {
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

  const leads = result?.leads ?? null;
  const error = result?.error ?? null;

  if (!ready) return <p className={NOTE}>Loading…</p>;
  if (!user) return <p className={NOTE}>Sign in from the home page to see your quote requests.</p>;
  if (error) return <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!leads) return <p className={NOTE}>Loading your quote requests…</p>;
  if (leads.length === 0) {
    return <p className={NOTE}>No requests yet. They arrive here when a visitor to your page asks for a quote.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} onChanged={reload} />
      ))}
    </ul>
  );
}
