---
type: idea
project: "[[Portfolio]]"
status: building
stack: [Next.js, TypeScript, WebGL, Transformers.js, FastAPI, Supabase, Replicate]
ai-feature: Floor segmentation + perspective-correct texture overlay + optional AI photoreal pass
impact: 5
effort: 4
created: 2026-10-08
tracker: "[[NextFloor]]"
tags: [idea, portfolio, computer-vision, flagship]
reference: https://floor-wiz.com/
---
# 🏗️ NextFloor — Epoxy Floor Visualizer

## One-liner
> Snap or upload a photo of your floor, pick an epoxy design, see the finished floor in seconds.

## Problem
- Homeowners can't picture how a flake / metallic / quartz floor will look in *their* garage.
- Contractors lose deals because swatches and brochures don't sell the result.
- Reference: [floorWIZ](https://floor-wiz.com/) — sold to contractors (Lite/Pro/Enterprise), lead capture, share links.

## Users
| User                | Needs                                                            |
| ------------------- | ---------------------------------------------------------------- |
| **Homeowner**       | Upload photo → try designs → save/share → request quote          |
| **Contractor** (v2) | Branded visualizer, own templates, leads inbox, embed on website |

## How it works (pipeline)
1. **Capture** — camera (`getUserMedia`) or upload; resize to ~1024px.
2. **Detect floor** — segmentation model returns floor mask.
   - Fast path: SegFormer (ADE20K "floor" class) in browser via Transformers.js / ONNX WebGPU.
   - Accurate path: SAM 2 on server (tap-to-refine points).
3. **Find perspective** — fit 4 corners of floor plane → homography. User can drag corners to fix.
4. **Apply template** — tile texture in WebGL shader, warp by homography, clip to mask.
5. **Keep realism** — blend original luminance (shadows, light reflections) + feathered mask edges.
6. **Optional "Photoreal" button** — inpainting model (e.g. Flux Fill / SDXL inpaint + depth ControlNet) for a final render.
7. **Compare** — before/after slider, download, share link.

## AI part
- Floor segmentation (semantic + interactive SAM refine)
- Plane / perspective estimation (homography, optional depth model like Depth Anything)
- Generative inpainting for photoreal mode
- Stretch: "Describe your dream floor" → AI generates a new texture template

## Full-stack part
| Layer                     | Choice                                                |
| ------------------------- | ----------------------------------------------------- |
| Frontend                  | Next.js (App Router) + TypeScript + Tailwind          |
| Rendering                 | WebGL2 / Three.js shader (texture warp + blend)       |
| In-browser AI             | Transformers.js / onnxruntime-web (WebGPU)            |
| Backend                   | Next.js API routes + Python FastAPI service for SAM 2 |
| AI hosting                | Replicate or Modal (GPU on demand)                    |
| Database / Auth / Storage | Supabase (Postgres, Auth, Storage)                    |
| Deploy                    | Vercel (web) + Modal/Replicate (models)               |

## Data model (draft)
| Table | Fields |
|---|---|
| `templates` | id, name, category (flake/metallic/quartz/solid), texture_url, scale, gloss |
| `projects` | id, user_id, original_url, mask_url, corners, created_at |
| `renders` | id, project_id, template_id, image_url, photoreal (bool) |
| `leads` (v2) | id, contractor_id, render_id, name, email, phone |

## MVP features
- [ ] Upload / camera capture (mobile-first)
- [ ] Auto floor detection + manual corner/brush fix
- [ ] 8–12 epoxy templates (flake, metallic, quartz, solid)
- [ ] Real-time template switching (<100 ms per switch)
- [ ] Before/after slider + download
- [ ] Save projects (auth) + share link

## v2 / stretch
- [ ] Photoreal AI render mode
- [ ] Custom blend builder (pick flake colors + ratio)
- [ ] Contractor accounts: branding, own templates, leads inbox, embeddable widget
- [ ] Price estimate from floor area (sq ft from plane + one known measurement)
- [ ] Gloss / reflection slider

## "High-performance" targets
| Metric | Target |
|---|---|
| Floor detection | < 2 s (in-browser, WebGPU) |
| Template switch | < 100 ms (GPU shader, no server call) |
| Lighthouse perf | ≥ 90 on mobile |
| Image upload | Client-side resize + direct-to-storage upload |

## What it proves (skills shown)
- Applied computer vision (segmentation, homography, depth)
- Running AI models in the browser *and* on GPU servers
- WebGL / graphics programming
- Full-stack product: auth, storage, DB, sharing, deploy
- Real business case (B2B SaaS for contractors)

## Risks / open questions
- Messy photos (cars, clutter, low light) → need good manual-fix tools.
- Realistic textures: source seamless epoxy texture images (photograph samples or generate with AI).
- Homeowner-first or contractor-first for MVP?
- Free in-browser model vs paid server model — accuracy vs cost.

## Build phases
| Phase | Scope | Time |
|---|---|---|
| 1 | Upload + manual 4-corner select + WebGL texture overlay | 3–4 days |
| 2 | Auto segmentation (in-browser) + mask refine | 4–5 days |
| 3 | Supabase auth, saved projects, share links | 3 days |
| 4 | Polish, mobile, deploy, case study | 3 days |
| 5 (stretch) | Photoreal AI mode, contractor features | 1–2 wks |
