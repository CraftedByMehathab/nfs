"use client";

import { useState } from "react";
import Image from "next/image";
import { TEXT_LINK } from "@/components/buttonStyles";
import { deleteLead, type Lead } from "@/lib/contractors/leads";
import { getSupabase } from "@/lib/supabase/client";

type LeadCardProps = {
  lead: Lead;
  /** Called after the request is deleted. */
  onChanged: () => void | Promise<void>;
};

/** One quote request in the contractor's inbox. */
export function LeadCard({ lead, onChanged }: LeadCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    try {
      await deleteLead(supabase, lead);
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete the request.");
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:flex-row dark:border-white/20">
      {lead.pictureUrl && (
        // The picture's size is not stored, so the box sets it and the picture fits inside.
        <a href={lead.pictureUrl} target="_blank" rel="noreferrer" className="relative block aspect-4/3 w-full shrink-0 sm:w-56">
          <Image
            src={lead.pictureUrl}
            alt={`The picture ${lead.name} sent${lead.templateName ? `, with the ${lead.templateName} finish` : ""}`}
            fill
            unoptimized
            className="rounded-lg object-contain"
          />
        </a>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm">
          <span className="font-medium">{lead.name}</span>
          <span className="text-zinc-600 dark:text-zinc-400">
            {" · "}
            {new Date(lead.createdAt).toLocaleDateString()}
            {lead.templateName && ` · ${lead.templateName}`}
          </span>
        </p>
        {lead.message && <p className="text-sm whitespace-pre-wrap break-words">{lead.message}</p>}
        <div className="flex flex-wrap gap-x-4">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className={`${TEXT_LINK} break-all`}>
              {lead.email}
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className={TEXT_LINK}>
              {lead.phone}
            </a>
          )}
          <button type="button" disabled={busy} onClick={remove} className={`${TEXT_LINK} text-red-600 dark:text-red-400`}>
            Delete
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </li>
  );
}
