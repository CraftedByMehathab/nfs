export type TemplateCategory = "flake" | "metallic" | "quartz" | "solid";

/** An epoxy finish. Mirrors the `templates` table in docs/SPEC.md. */
export type Template = {
  readonly id: string;
  readonly name: string;
  readonly category: TemplateCategory;
  /** How many times the texture repeats across the perspective corners at normal size. */
  readonly scale: number;
  /** Paints one seamless tile. Stands in for `texture_url` until real images exist. */
  readonly draw: (context: CanvasRenderingContext2D, size: number) => void;
};
