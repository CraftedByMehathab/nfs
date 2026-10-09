import type { AppSupabaseClient } from "@/lib/supabase/client";
import { isAccent } from "./accent";
import { isValidSlug, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH } from "./slug";

const NAME_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 254;
const PHONE_MAX_LENGTH = 40;
// Postgres's code for breaking a unique constraint.
const UNIQUE_VIOLATION = "23505";

/** What a contractor's page shows. */
export type ContractorProfile = {
  /** The page address: /c/<slug>. */
  slug: string;
  name: string;
  /** Header background colour, as '#rrggbb'. */
  accent: string;
  email: string | null;
  phone: string | null;
};

/** A profile as typed into the form, before it is checked. */
export type ContractorDraft = {
  slug: string;
  name: string;
  accent: string;
  email: string;
  phone: string;
};

export type CheckedDraft = { profile: ContractorProfile; error: null } | { profile: null; error: string };

/** Tidies a typed-in profile and says what is wrong with it, if anything. */
export function checkDraft(draft: ContractorDraft): CheckedDraft {
  const name = draft.name.trim();
  const slug = draft.slug.trim();
  const accent = draft.accent.toLowerCase();
  const email = draft.email.trim();
  const phone = draft.phone.trim();

  const fail = (error: string): CheckedDraft => ({ profile: null, error });
  if (!name) return fail("Enter your business name.");
  if (name.length > NAME_MAX_LENGTH) return fail(`Keep the business name to ${NAME_MAX_LENGTH} characters.`);
  if (!isValidSlug(slug)) {
    return fail(
      `The page address needs ${SLUG_MIN_LENGTH} to ${SLUG_MAX_LENGTH} lower-case letters or numbers, with single hyphens between words.`,
    );
  }
  if (!isAccent(accent)) return fail("Pick a header colour.");
  if (email && (!/^\S+@\S+\.\S+$/.test(email) || email.length > EMAIL_MAX_LENGTH)) {
    return fail("That email address does not look right.");
  }
  if (phone.length > PHONE_MAX_LENGTH) return fail(`Keep the phone number to ${PHONE_MAX_LENGTH} characters.`);

  return { profile: { slug, name, accent, email: email || null, phone: phone || null }, error: null };
}

/** Where a contractor's page can be visited. Browser-only. */
export function contractorPageUrl(slug: string): string {
  return `${window.location.origin}/c/${slug}`;
}

/** The signed-in user's contractor page, or null if they have not set one up. */
export async function loadOwnProfile(supabase: AppSupabaseClient): Promise<ContractorProfile | null> {
  // Row-level security limits this to the user's own row.
  const { data, error } = await supabase
    .from("contractors")
    .select("slug, name, accent, email, phone")
    .maybeSingle();
  if (error) throw new Error(`Could not load your business page: ${error.message}`);
  return data;
}

/** Creates the signed-in user's contractor page, or replaces its details. */
export async function saveProfile(supabase: AppSupabaseClient, profile: ContractorProfile): Promise<void> {
  const { error } = await supabase.from("contractors").upsert(profile, { onConflict: "user_id" });
  if (!error) return;
  if (error.code === UNIQUE_VIOLATION) {
    throw new Error("That page address is taken. Try another one.");
  }
  throw new Error(`Could not save your business page: ${error.message}`);
}
