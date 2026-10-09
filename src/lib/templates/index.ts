import type { Template } from "@/types/template";
import { drawFlake } from "./flake";
import { drawMetallic } from "./metallic";
import { drawQuartz } from "./quartz";

const TEXTURE_SIZE = 512;
const THUMBNAIL_SIZE = 128;

export const TEMPLATES: readonly [Template, ...Template[]] = [
  { id: "granite-flake", name: "Granite Flake", category: "flake", scale: 3, draw: drawFlake },
  { id: "pewter-metallic", name: "Pewter Metallic", category: "metallic", scale: 1.5, draw: drawMetallic },
  { id: "sand-quartz", name: "Sand Quartz", category: "quartz", scale: 4, draw: drawQuartz },
];

const textures = new Map<string, HTMLCanvasElement>();
const thumbnails = new Map<string, string>();

function createCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  return [canvas, context];
}

/** The template's seamless tile, painted on first use. Browser-only. */
export function getTemplateTexture(template: Template): HTMLCanvasElement {
  let canvas = textures.get(template.id);
  if (!canvas) {
    const [created, context] = createCanvas(TEXTURE_SIZE);
    template.draw(context, TEXTURE_SIZE);
    textures.set(template.id, created);
    canvas = created;
  }
  return canvas;
}

/** A small preview of the template as a data URL. Browser-only. */
export function getTemplateThumbnail(template: Template): string {
  let url = thumbnails.get(template.id);
  if (!url) {
    const [canvas, context] = createCanvas(THUMBNAIL_SIZE);
    // Show the top-left quarter at half size, so the grain is still recognisable.
    const crop = TEXTURE_SIZE / 2;
    context.drawImage(getTemplateTexture(template), 0, 0, crop, crop, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    url = canvas.toDataURL("image/jpeg", 0.85);
    thumbnails.set(template.id, url);
  }
  return url;
}
