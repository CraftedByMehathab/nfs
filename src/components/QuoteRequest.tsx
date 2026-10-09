"use client";

import { useEffect, useRef, useState } from "react";
import { usePageContractor } from "@/components/ContractorContext";
import { ACTIVE_BUTTON, TEXT_LINK } from "@/components/buttonStyles";
import { checkLeadDraft, submitLead, type LeadDraft } from "@/lib/contractors/leads";
import { getSupabase } from "@/lib/supabase/client";

const LABEL = "flex flex-col gap-1 text-sm font-medium";
const FIELD =
  "min-h-11 rounded-lg border border-black/10 bg-transparent px-3 text-base font-normal dark:border-white/20";
const NOTE = "text-sm text-zinc-600 dark:text-zinc-400";
const EMPTY: LeadDraft = { name: "", email: "", phone: "", message: "" };

type QuoteRequestProps = {
  /** Captures the picture on screen; null if it cannot be captured. */
  getPicture: () => Promise<Blob | null>;
  /** The finish in the picture. */
  templateId: string;
};

/**
 * On a contractor's page, lets the visitor send their details and the picture
 * on screen to that contractor. Renders nothing on NextFloor's own pages.
 */
export function QuoteRequest({ getPicture, templateId }: QuoteRequestProps) {
  const contractor = usePageContractor();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set once a request has gone through; says whether its picture went too.
  const [sent, setSent] = useState<{ pictureSent: boolean } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!contractor) return null;
  const { slug, name } = contractor;

  const change = (field: keyof LeadDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    const checked = checkLeadDraft(draft);
    if (!checked.lead) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setSent(await submitLead(supabase, slug, checked.lead, templateId, await getPicture()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send your request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setSent(null); setOpen(true); }} className={ACTIVE_BUTTON}>
        Request a quote
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="quote-title"
        className="m-auto max-h-[92dvh] w-[min(92vw,26rem)] overflow-y-auto rounded-2xl bg-background p-6 text-foreground shadow-xl backdrop:bg-black/60"
      >
        <h2 id="quote-title" className="text-lg font-semibold">
          Request a quote from {name}
        </h2>
        {sent ? (
          <p role="status" className={`mt-3 ${NOTE}`}>
            Sent. {name} has your details{sent.pictureSent ? " and your picture" : ", but the picture could not be attached"}
            .
          </p>
        ) : (
          <form onSubmit={submit} className="mt-3 flex flex-col gap-4" noValidate>
            <p className={NOTE}>{name} will get these details and the picture on screen.</p>
            <label className={LABEL}>
              Your name
              <input value={draft.name} onChange={(e) => change("name", e.target.value)} autoComplete="name" className={FIELD} />
            </label>
            <label className={LABEL}>
              Email
              <input type="email" value={draft.email} onChange={(e) => change("email", e.target.value)} autoComplete="email" className={FIELD} />
            </label>
            <label className={LABEL}>
              Phone
              <input type="tel" value={draft.phone} onChange={(e) => change("phone", e.target.value)} autoComplete="tel" className={FIELD} />
            </label>
            <p className={`-mt-2 ${NOTE}`}>Give an email address, a phone number, or both.</p>
            <label className={LABEL}>
              Message <span className={`font-normal ${NOTE}`}>Optional: the size of the floor, when you want it done.</span>
              <textarea value={draft.message} onChange={(e) => change("message", e.target.value)} rows={3} className={`${FIELD} py-2`} />
            </label>
            <p role="alert" className="min-h-5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <button type="submit" disabled={busy} className={ACTIVE_BUTTON}>
              {busy ? "Sending…" : "Send request"}
            </button>
          </form>
        )}
        <button type="button" onClick={() => setOpen(false)} className={`${TEXT_LINK} mt-2`}>
          Close
        </button>
      </dialog>
    </>
  );
}
