"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ContractorForm } from "@/components/ContractorForm";
import { TEXT_LINK } from "@/components/buttonStyles";
import { useSession } from "@/components/useSession";
import { contractorPageUrl, loadOwnProfile, type ContractorProfile } from "@/lib/contractors/profile";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";

const NOTE = "text-sm text-zinc-600 dark:text-zinc-400";

type LoadResult = { profile: ContractorProfile | null; error: string | null };

async function load(): Promise<LoadResult> {
  const supabase = getSupabase();
  if (!supabase) return { profile: null, error: null };
  try {
    return { profile: await loadOwnProfile(supabase), error: null };
  } catch (cause) {
    return {
      profile: null,
      error: cause instanceof Error ? cause.message : "Could not load your business page.",
    };
  }
}

/** Where the signed-in user sets up or edits their contractor page. */
export function ContractorSettings() {
  const { user, ready } = useSession();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [note, setNote] = useState<string | null>(null);

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

  if (!supabaseConfigured) return <p className={NOTE}>Business pages need accounts, which are not set up here.</p>;
  if (!ready) return <p className={NOTE}>Loading…</p>;
  if (!user) return <p className={NOTE}>Sign in from the home page to set up your business page.</p>;
  if (!result) return <p className={NOTE}>Loading your business page…</p>;
  if (result.error) return <p role="alert" className="text-sm text-red-600 dark:text-red-400">{result.error}</p>;

  const { profile } = result;

  async function copyLink(slug: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(contractorPageUrl(slug));
      setNote("Link copied.");
    } catch {
      setNote("Could not copy the link. Copy it from the address bar of your page.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {profile && (
        <div className="flex flex-wrap items-center gap-x-4 rounded-lg border border-black/10 px-4 py-2 dark:border-white/20">
          <span className="text-sm">Your page is live at /c/{profile.slug}</span>
          <Link href={`/c/${profile.slug}`} className={TEXT_LINK}>
            Open it
          </Link>
          <button type="button" onClick={() => copyLink(profile.slug)} className={TEXT_LINK}>
            Copy link
          </button>
          <Link href="/contractor/leads" className={TEXT_LINK}>
            Quote requests
          </Link>
        </div>
      )}
      <p role="status" className={`${NOTE} min-h-5`}>
        {note}
      </p>
      <ContractorForm
        saved={profile}
        onSaved={(next) => {
          setResult({ profile: next, error: null });
          setNote("Saved.");
        }}
      />
    </div>
  );
}
