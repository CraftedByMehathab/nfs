import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import type { Polygon, Quad } from "@/types/geometry";

/** Everything needed to store the picture on screen. */
export type ProjectSnapshot = {
  photo: ImageBitmap;
  perspective: Quad;
  /** Hand-drawn outline, or null when the floor area is the perspective corners or a mask. */
  outline: Polygon | null;
  /** Detected or painted mask, which takes the place of the outline. */
  mask: HTMLCanvasElement | null;
  templateId: string;
  patternSize: number;
  shading: number;
  /** The finished picture as a JPEG. */
  render: Blob;
};

export type SavedRender = {
  projectId: string;
  renderId: string;
};

function toJson(points: Polygon): Json[] {
  return points.map(({ x, y }) => ({ x, y }));
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The picture could not be encoded"))),
      type,
      quality,
    );
  });
}

function photoToBlob(photo: ImageBitmap): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = photo.width;
  canvas.height = photo.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  context.drawImage(photo, 0, 0);
  return canvasToBlob(canvas, "image/jpeg", 0.92);
}

async function upload(
  supabase: AppSupabaseClient,
  bucket: string,
  path: string,
  blob: Blob,
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

/** Deletes the project's earlier mask files, leaving `keepPath`. Failing only leaves them behind. */
async function removeOldMasks(
  supabase: AppSupabaseClient,
  folder: string,
  keepPath: string | null,
): Promise<void> {
  const { data } = await supabase.storage.from("photos").list(folder);
  const old = (data ?? [])
    .map((file) => `${folder}/${file.name}`)
    .filter((path) => /\/mask[^/]*\.png$/.test(path) && path !== keepPath);
  if (old.length > 0) await supabase.storage.from("photos").remove(old);
}

/**
 * Replaces a saved render's picture and finish settings. The picture goes in a
 * new file, for the same caching reason as masks, and the public copy of a
 * shared render is replaced too so its link shows the new picture.
 */
async function updateRender(
  supabase: AppSupabaseClient,
  renderId: string,
  snapshot: ProjectSnapshot,
  imagePath: string,
): Promise<void> {
  const previous = await supabase.from("renders").select("image_path, share_slug").eq("id", renderId).single();
  if (previous.error) throw new Error(`Could not find the saved picture: ${previous.error.message}`);

  await upload(supabase, "renders", imagePath, snapshot.render);
  const updated = await supabase
    .from("renders")
    .update({
      template_id: snapshot.templateId,
      pattern_size: snapshot.patternSize,
      shading: snapshot.shading,
      image_path: imagePath,
    })
    .eq("id", renderId);
  if (updated.error) throw new Error(`Could not save the picture: ${updated.error.message}`);
  await supabase.storage.from("renders").remove([previous.data.image_path]);

  const slug = previous.data.share_slug;
  if (slug) {
    // The shared bucket allows adding and removing files but not overwriting them.
    await supabase.storage.from("shared").remove([`${slug}.jpg`]);
    const published = await supabase.storage
      .from("shared")
      .upload(`${slug}.jpg`, snapshot.render, { contentType: "image/jpeg" });
    if (published.error) throw new Error(`Saved, but the shared link was not updated: ${published.error.message}`);
  }
}

/**
 * Stores the picture on screen. The first call for a photo creates its project
 * and a render. Pass that project's id on later calls to keep its floor area up
 * to date; they add a further render, unless `existingRenderId` names a render
 * of the project, which is then replaced instead.
 */
export async function saveRender(
  supabase: AppSupabaseClient,
  userId: string,
  snapshot: ProjectSnapshot,
  existingProjectId: string | null,
  existingRenderId: string | null = null,
): Promise<SavedRender> {
  const projectId = existingProjectId ?? crypto.randomUUID();
  const folder = `${userId}/${projectId}`;
  const originalPath = `${folder}/original.jpg`;

  if (!existingProjectId) {
    await upload(supabase, "photos", originalPath, await photoToBlob(snapshot.photo));
  }
  let maskPath: string | null = null;
  if (snapshot.mask) {
    // A new name for every save: files are cached by path, so overwriting one
    // would keep serving the mask as it was before the latest brush strokes.
    maskPath = `${folder}/mask-${crypto.randomUUID()}.png`;
    await upload(supabase, "photos", maskPath, await canvasToBlob(snapshot.mask, "image/png"));
  }

  const project = await supabase.from("projects").upsert({
    id: projectId,
    width: snapshot.photo.width,
    height: snapshot.photo.height,
    original_path: originalPath,
    mask_path: maskPath,
    outline: snapshot.mask || !snapshot.outline ? null : toJson(snapshot.outline),
    corners: toJson(snapshot.perspective),
  });
  if (project.error) throw new Error(`Could not save the project: ${project.error.message}`);
  if (existingProjectId) await removeOldMasks(supabase, folder, maskPath);

  if (existingRenderId) {
    await updateRender(supabase, existingRenderId, snapshot, `${folder}/${crypto.randomUUID()}.jpg`);
    return { projectId, renderId: existingRenderId };
  }

  const renderId = crypto.randomUUID();
  const imagePath = `${folder}/${renderId}.jpg`;
  await upload(supabase, "renders", imagePath, snapshot.render);

  const render = await supabase.from("renders").insert({
    id: renderId,
    project_id: projectId,
    template_id: snapshot.templateId,
    pattern_size: snapshot.patternSize,
    shading: snapshot.shading,
    image_path: imagePath,
  });
  if (render.error) throw new Error(`Could not save the picture: ${render.error.message}`);

  return { projectId, renderId };
}
