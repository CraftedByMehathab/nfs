import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type AppSupabaseClient = SupabaseClient<Database>;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: AppSupabaseClient | null | undefined;

/** True when the app has been given a Supabase project to talk to. */
export const supabaseConfigured = Boolean(url && key);

/**
 * The signed-in user's Supabase client, shared across the page. The session is
 * kept in the browser, so sign-in in one tab reaches the others. Returns null
 * when no project is configured, in which case accounts are simply unavailable.
 * Browser-only.
 */
export function getSupabase(): AppSupabaseClient | null {
  if (browserClient === undefined) {
    browserClient = url && key ? createClient<Database>(url, key, { auth: { flowType: "pkce" } }) : null;
  }
  return browserClient;
}

/** A client with no session, for reading public data on the server. */
export function createAnonymousClient(): AppSupabaseClient | null {
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Public address of a shared picture. */
export function sharedPictureUrl(slug: string): string {
  return `${url ?? ""}/storage/v1/object/public/shared/${slug}.jpg`;
}
