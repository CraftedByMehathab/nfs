import type { AppSupabaseClient } from "@/lib/supabase/client";

const THUMBNAIL_LIFETIME_SECONDS = 60 * 60;

export type SavedRenderItem = {
  id: string;
  projectId: string;
  templateName: string;
  width: number;
  height: number;
  createdAt: string;
  imagePath: string;
  /** A temporary link to the private picture. */
  imageUrl: string;
  shareSlug: string | null;
};

/** The signed-in user's saved pictures, newest first. */
export async function listRenders(supabase: AppSupabaseClient): Promise<SavedRenderItem[]> {
  const { data, error } = await supabase
    .from("renders")
    .select("id, project_id, image_path, share_slug, created_at, templates(name), projects(width, height)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your pictures: ${error.message}`);
  if (data.length === 0) return [];

  const signed = await supabase.storage
    .from("renders")
    .createSignedUrls(
      data.map((row) => row.image_path),
      THUMBNAIL_LIFETIME_SECONDS,
    );
  if (signed.error) throw new Error(`Could not load your pictures: ${signed.error.message}`);
  const urls = new Map(signed.data.map((entry) => [entry.path, entry.signedUrl]));

  return data.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    templateName: row.templates.name,
    width: row.projects.width,
    height: row.projects.height,
    createdAt: row.created_at,
    imagePath: row.image_path,
    imageUrl: urls.get(row.image_path) ?? "",
    shareSlug: row.share_slug,
  }));
}

/** Fetches a saved render's JPEG, for sharing or downloading it later. */
export async function downloadRender(supabase: AppSupabaseClient, imagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from("renders").download(imagePath);
  if (error) throw new Error(`Could not load the picture: ${error.message}`);
  return data;
}

/** Deletes a saved render, its file, and its public copy if it was shared. */
export async function deleteRender(supabase: AppSupabaseClient, item: SavedRenderItem): Promise<void> {
  const { error } = await supabase.from("renders").delete().eq("id", item.id);
  if (error) throw new Error(`Could not delete the picture: ${error.message}`);
  await supabase.storage.from("renders").remove([item.imagePath]);
  if (item.shareSlug) await supabase.storage.from("shared").remove([`${item.shareSlug}.jpg`]);
}
