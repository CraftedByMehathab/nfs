"use client";

import { useState } from "react";
import { ACTIVE_BUTTON } from "@/components/buttonStyles";
import { DEFAULT_ACCENT } from "@/lib/contractors/accent";
import { checkDraft, saveProfile, type ContractorDraft, type ContractorProfile } from "@/lib/contractors/profile";
import { slugify } from "@/lib/contractors/slug";
import { getSupabase } from "@/lib/supabase/client";

const LABEL = "flex flex-col gap-1 text-sm font-medium";
const FIELD =
  "min-h-11 rounded-lg border border-black/10 bg-transparent px-3 text-base font-normal dark:border-white/20";
const HINT = "text-sm font-normal text-zinc-600 dark:text-zinc-400";

type ContractorFormProps = {
  /** The page as last saved, or null when it is being set up. */
  saved: ContractorProfile | null;
  onSaved: (profile: ContractorProfile) => void;
};

function toDraft(saved: ContractorProfile | null): ContractorDraft {
  return {
    slug: saved?.slug ?? "",
    name: saved?.name ?? "",
    accent: saved?.accent ?? DEFAULT_ACCENT,
    email: saved?.email ?? "",
    phone: saved?.phone ?? "",
  };
}

/** The details of a contractor's page: name, address, colour and contact. */
export function ContractorForm({ saved, onSaved }: ContractorFormProps) {
  const [draft, setDraft] = useState(() => toDraft(saved));
  // A new page's address follows the name until the address is typed by hand.
  const [slugFollowsName, setSlugFollowsName] = useState(saved === null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function change(field: keyof ContractorDraft, value: string): void {
    setDraft((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && slugFollowsName) next.slug = slugify(value);
      return next;
    });
    if (field === "slug") setSlugFollowsName(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    const checked = checkDraft(draft);
    if (!checked.profile) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveProfile(supabase, checked.profile);
      onSaved(checked.profile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your business page.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <label className={LABEL}>
        Business name
        <input
          value={draft.name}
          onChange={(event) => change("name", event.target.value)}
          autoComplete="organization"
          className={FIELD}
        />
      </label>
      <label className={LABEL}>
        Page address
        <input
          value={draft.slug}
          onChange={(event) => change("slug", event.target.value)}
          autoCapitalize="none"
          spellCheck={false}
          className={FIELD}
        />
        <span className={HINT}>
          Your page will be at /c/{draft.slug || "your-business"}.
          {saved && " Changing this breaks links you have already given out."}
        </span>
      </label>
      <label className={LABEL}>
        Header colour
        <input
          type="color"
          value={draft.accent}
          onChange={(event) => change("accent", event.target.value)}
          className="h-11 w-20 rounded-lg border border-black/10 bg-transparent p-1 dark:border-white/20"
        />
      </label>
      <label className={LABEL}>
        Contact email <span className={HINT}>Optional. Shown on your page.</span>
        <input
          type="email"
          value={draft.email}
          onChange={(event) => change("email", event.target.value)}
          autoComplete="email"
          className={FIELD}
        />
      </label>
      <label className={LABEL}>
        Contact phone <span className={HINT}>Optional. Shown on your page.</span>
        <input
          type="tel"
          value={draft.phone}
          onChange={(event) => change("phone", event.target.value)}
          autoComplete="tel"
          className={FIELD}
        />
      </label>
      <p role="alert" className="min-h-5 text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
      <button type="submit" disabled={busy} className={`${ACTIVE_BUTTON} self-start`}>
        {busy ? "Saving…" : saved ? "Save changes" : "Create my page"}
      </button>
    </form>
  );
}
