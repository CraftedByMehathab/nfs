import type { AppSupabaseClient } from "@/lib/supabase/client";
import { looksLikeEmail, NAME_MAX_LENGTH, PHONE_MAX_LENGTH } from "./contact";

const MESSAGE_MAX_LENGTH = 2000;
const PICTURE_LIFETIME_SECONDS = 60 * 60;

/** A quote request as typed into the form, before it is checked. */
export type LeadDraft = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export type CheckedLead = { lead: LeadDraft; error: null } | { lead: null; error: string };

/** Tidies a typed-in quote request and says what is wrong with it, if anything. */
export function checkLeadDraft(draft: LeadDraft): CheckedLead {
  const name = draft.name.trim();
  const email = draft.email.trim();
  const phone = draft.phone.trim();
  const message = draft.message.trim();

  const fail = (error: string): CheckedLead => ({ lead: null, error });
  if (!name) return fail("Enter your name.");
  if (name.length > NAME_MAX_LENGTH) return fail(`Keep your name to ${NAME_MAX_LENGTH} characters.`);
  if (!email && !phone) return fail("Enter an email address or a phone number, so they can reply.");
  if (email && !looksLikeEmail(email)) return fail("That email address does not look right.");
  if (phone.length > PHONE_MAX_LENGTH) return fail(`Keep the phone number to ${PHONE_MAX_LENGTH} characters.`);
  if (message.length > MESSAGE_MAX_LENGTH) return fail(`Keep the message to ${MESSAGE_MAX_LENGTH} characters.`);

  return { lead: { name, email, phone, message }, error: null };
}

/**
 * Sends a quote request to the contractor at `slug`, with the picture on screen
 * if there is one. Works signed out. Returns false for `pictureSent` when the
 * request went through but its picture did not.
 */
export async function submitLead(
  supabase: AppSupabaseClient,
  slug: string,
  lead: LeadDraft,
  templateId: string,
  picture: Blob | null,
): Promise<{ pictureSent: boolean }> {
  const { data: picturePath, error } = await supabase.rpc("submit_lead", {
    slug,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    template_id: templateId,
  });
  if (error) throw new Error(`Could not send your request: ${error.message}`);
  if (!picture) return { pictureSent: false };

  const uploaded = await supabase.storage.from("leads").upload(picturePath, picture, { contentType: "image/jpeg" });
  return { pictureSent: !uploaded.error };
}

/** A quote request in the contractor's inbox. */
export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  /** Name of the finish in the picture, if it is still in the catalogue. */
  templateName: string | null;
  createdAt: string;
  picturePath: string;
  /** A temporary link to the picture; null when none was attached. */
  pictureUrl: string | null;
};

/** The quote requests sent to the signed-in contractor, newest first. */
export async function listLeads(supabase: AppSupabaseClient): Promise<Lead[]> {
  // Row-level security limits this to the user's own requests.
  const { data, error } = await supabase
    .from("leads")
    .select("id, contractor_id, name, email, phone, message, created_at, templates(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your quote requests: ${error.message}`);
  if (data.length === 0) return [];

  const paths = data.map((row) => `${row.contractor_id}/${row.id}.jpg`);
  const signed = await supabase.storage.from("leads").createSignedUrls(paths, PICTURE_LIFETIME_SECONDS);
  if (signed.error) throw new Error(`Could not load your quote requests: ${signed.error.message}`);
  // A request sent without a picture has no file, so no link comes back for it.
  const urls = new Map(signed.data.map((entry) => [entry.path, entry.error ? null : entry.signedUrl]));

  return data.map((row, index) => {
    const picturePath = paths[index] ?? "";
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      templateName: row.templates?.name ?? null,
      createdAt: row.created_at,
      picturePath,
      pictureUrl: urls.get(picturePath) ?? null,
    };
  });
}

/** Deletes a quote request and its picture. */
export async function deleteLead(supabase: AppSupabaseClient, lead: Lead): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", lead.id);
  if (error) throw new Error(`Could not delete the request: ${error.message}`);
  await supabase.storage.from("leads").remove([lead.picturePath]);
}
