import type { Template } from "@/types/template";
import { createFlake } from "./flake";
import { createMetallic } from "./metallic";
import { createQuartz } from "./quartz";
import { createSolid } from "./solid";

const TEXTURE_SIZE = 512;
const THUMBNAIL_SIZE = 128;

/**
 * The finish catalogue. Every id here must also be a row in the `templates`
 * table (see supabase/migrations), because saved pictures refer to it.
 */
export const TEMPLATES: readonly [Template, ...Template[]] = [
  {
    id: "granite-flake",
    name: "Granite Flake",
    category: "flake",
    scale: 3,
    draw: createFlake({
      seed: 11,
      base: "#8d9199",
      chips: ["#1f2328", "#f2f2ee", "#6f757d", "#3d5a80", "#b9bec6", "#f2f2ee"],
    }),
  },
  {
    id: "midnight-flake",
    name: "Midnight Flake",
    category: "flake",
    scale: 3,
    draw: createFlake({
      seed: 17,
      base: "#2b2e33",
      chips: ["#0e0f11", "#e9e9e4", "#5b6068", "#8a9099", "#3a4a66", "#0e0f11"],
    }),
  },
  {
    id: "saddle-flake",
    name: "Saddle Flake",
    category: "flake",
    scale: 3,
    draw: createFlake({
      seed: 23,
      base: "#b79a78",
      chips: ["#5a4230", "#f1e7d6", "#8c6f52", "#d8c3a3", "#3b2c22", "#f1e7d6"],
    }),
  },
  {
    id: "pewter-metallic",
    name: "Pewter Metallic",
    category: "metallic",
    scale: 1.5,
    draw: createMetallic({ dark: [52, 58, 66], light: [196, 205, 214], shine: [245, 248, 250], phase: 0 }),
  },
  {
    id: "copper-metallic",
    name: "Copper Metallic",
    category: "metallic",
    scale: 1.5,
    draw: createMetallic({ dark: [74, 40, 24], light: [196, 124, 78], shine: [250, 222, 190], phase: 1.7 }),
  },
  {
    id: "ocean-metallic",
    name: "Ocean Metallic",
    category: "metallic",
    scale: 1.5,
    draw: createMetallic({ dark: [14, 42, 74], light: [58, 128, 178], shine: [214, 238, 250], phase: 3.1 }),
  },
  {
    id: "sand-quartz",
    name: "Sand Quartz",
    category: "quartz",
    scale: 4,
    draw: createQuartz({ seed: 29, grains: ["#c8b79a", "#a8977c", "#e6dccb", "#7d7263", "#d9cdb8", "#c8b79a"] }),
  },
  {
    id: "slate-quartz",
    name: "Slate Quartz",
    category: "quartz",
    scale: 4,
    draw: createQuartz({ seed: 31, grains: ["#8b9096", "#6c7178", "#b4b9bf", "#4f545a", "#9ea3a9", "#8b9096"] }),
  },
  { id: "dove-solid", name: "Dove Grey", category: "solid", scale: 1.5, draw: createSolid({ seed: 37, color: [184, 188, 192] }) },
  { id: "graphite-solid", name: "Graphite", category: "solid", scale: 1.5, draw: createSolid({ seed: 41, color: [63, 67, 71] }) },
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
