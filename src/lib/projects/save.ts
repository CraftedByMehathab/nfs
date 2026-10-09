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

/**
 * Stores the picture on screen as a new render. The first call for a photo also
 * creates its project; pass that project's id on later calls to add further
 * renders to it and keep its floor area up to date.
 */
export async function saveRender(
  supabase: AppSupabaseClient,
  userId: string,
  snapshot: ProjectSnapshot,
  existingProjectId: string | null,
): Promise<SavedRender> {
  const projectId = existingProjectId ?? crypto.randomUUID();
  const folder = `${userId}/${projectId}`;
  const originalPath = `${folder}/original.jpg`;

  if (!existingProjectId) {
    await upload(supabase, "photos", originalPath, await photoToBlob(snapshot.photo));
  }
  let maskPath: string | null = null;
  if (snapshot.mask) {
    maskPath = `${folder}/mask.png`;
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
