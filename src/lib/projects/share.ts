import type { AppSupabaseClient } from "@/lib/supabase/client";

const SLUG_BYTES = 16;

/** A random, URL-safe identifier that cannot be guessed: 22 characters from 128 bits. */
export function randomSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SLUG_BYTES));
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/** The page a shared picture can be viewed at. Browser-only. */
export function sharePageUrl(slug: string): string {
  return `${window.location.origin}/s/${slug}`;
}

/**
 * Makes a saved render public and returns its slug. `picture` is the render's
 * JPEG. Sharing again returns the same slug.
 */
export async function shareRender(
  supabase: AppSupabaseClient,
  renderId: string,
  picture: Blob,
): Promise<string> {
  const existing = await supabase.from("renders").select("share_slug").eq("id", renderId).single();
  if (existing.error) throw new Error(`Could not find the picture: ${existing.error.message}`);
  if (existing.data.share_slug) return existing.data.share_slug;

  const slug = randomSlug();
  const uploaded = await supabase.storage
    .from("shared")
    .upload(`${slug}.jpg`, picture, { contentType: "image/jpeg" });
  if (uploaded.error) throw new Error(`Could not publish the picture: ${uploaded.error.message}`);

  const updated = await supabase.from("renders").update({ share_slug: slug }).eq("id", renderId);
  if (updated.error) throw new Error(`Could not share the picture: ${updated.error.message}`);
  return slug;
}

/** Takes a shared render offline: its link stops working. */
export async function unshareRender(
  supabase: AppSupabaseClient,
  renderId: string,
  slug: string,
): Promise<void> {
  const updated = await supabase.from("renders").update({ share_slug: null }).eq("id", renderId);
  if (updated.error) throw new Error(`Could not stop sharing: ${updated.error.message}`);
  const removed = await supabase.storage.from("shared").remove([`${slug}.jpg`]);
  if (removed.error) throw new Error(`Could not remove the public copy: ${removed.error.message}`);
}
