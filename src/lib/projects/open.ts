import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import type { Point, Polygon, Quad } from "@/types/geometry";

/** A saved picture, loaded back into the form the editor works with. */
export type OpenedProject = {
  projectId: string;
  renderId: string;
  photo: ImageBitmap;
  perspective: Quad;
  /** Hand-drawn outline, or null when the floor area is the perspective corners or a mask. */
  outline: Polygon | null;
  /** Detected or painted mask, which takes the place of the outline. */
  mask: HTMLCanvasElement | null;
  templateId: string;
  patternSize: number;
  shading: number;
};

function parsePoint(value: Json | undefined): Point | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { x, y } = value;
  return typeof x === "number" && typeof y === "number" ? { x, y } : null;
}

/** Reads a stored outline: three or more `{x, y}` points. Null if it is anything else. */
export function parsePolygon(value: Json): Polygon | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const points: Point[] = [];
  for (const entry of value) {
    const point = parsePoint(entry);
    if (!point) return null;
    points.push(point);
  }
  return points;
}

/** Reads stored perspective corners: exactly four `{x, y}` points. Null if it is anything else. */
export function parseQuad(value: Json): Quad | null {
  const points = parsePolygon(value);
  if (!points || points.length !== 4) return null;
  const [a, b, c, d] = points;
  return a && b && c && d ? [a, b, c, d] : null;
}

async function downloadPhotoFile(supabase: AppSupabaseClient, path: string): Promise<ImageBitmap> {
  // Skip the browser cache: masks saved under the old fixed name were overwritten in place.
  const { data, error } = await supabase.storage.from("photos").download(path, undefined, { cache: "no-store" });
  if (error) throw new Error(`Could not load the photo: ${error.message}`);
  return createImageBitmap(data);
}

function toCanvas(image: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

/**
 * Loads a saved render's photo, floor area and finish settings. The caller owns
 * the returned photo and must close it. Browser-only.
 */
export async function openRender(supabase: AppSupabaseClient, renderId: string): Promise<OpenedProject> {
  const { data, error } = await supabase
    .from("renders")
    .select("template_id, pattern_size, shading, projects(id, original_path, mask_path, outline, corners)")
    .eq("id", renderId)
    .maybeSingle();
  if (error) throw new Error(`Could not open the picture: ${error.message}`);
  if (!data) throw new Error("That picture was not found. It may have been deleted, or you may be signed out.");

  const project = data.projects;
  const perspective = parseQuad(project.corners);
  if (!perspective) throw new Error("The saved picture is damaged and cannot be opened.");

  const photo = await downloadPhotoFile(supabase, project.original_path);
  try {
    let mask: HTMLCanvasElement | null = null;
    if (project.mask_path) {
      const image = await downloadPhotoFile(supabase, project.mask_path);
      try {
        mask = toCanvas(image, photo.width, photo.height);
      } finally {
        image.close();
      }
    }
    return {
      projectId: project.id,
      renderId,
      photo,
      perspective,
      outline: mask || project.outline === null ? null : parsePolygon(project.outline),
      mask,
      templateId: data.template_id,
      patternSize: data.pattern_size,
      shading: data.shading,
    };
  } catch (cause) {
    photo.close();
    throw cause;
  }
}
