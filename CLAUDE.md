# NextFloor

Epoxy floor visualizer: snap or upload a photo of a floor, pick an epoxy design, and see the finished floor in seconds. Full spec: [docs/SPEC.md](docs/SPEC.md).

@AGENTS.md

## Project summary

Pipeline (full product): capture photo -> detect floor -> fit 4 corners to a homography -> tile the template texture in a WebGL shader, warped by the homography and clipped to the floor -> blend original lighting -> compare, download, share.

**Current phase: Phase 2 — AI Floor Detection.** Phase 1 (upload or camera capture, resize to ~1024px, manual floor selection, WebGL2 overlay, 3 test finishes) is built.

The selection has two parts. The **perspective** is always exactly four corners marking a rectangle on the floor; it gives the homography. The **outline** says where the finish is shown; it is a mask texture that the shader clips to. The mask comes either from a hand-drawn polygon of three or more points, or from floor detection.

Floor detection runs SegFormer-B0 (ADE20K) through Transformers.js in a web worker (`src/lib/segmentation/`). It uses WebGPU when available and WebAssembly otherwise. The model is downloaded from huggingface.co and the ONNX runtime from jsDelivr on first use. The worker keeps only the floor class from the model's low-resolution output; the main thread stretches that to the photo's size. Add `?segmentation=wasm` or `?segmentation=webgpu` to the URL to force a backend when benchmarking.

After detection, `fitQuadToMask` (`src/lib/geometry/fitQuad.ts`) guesses the perspective corners from the mask. The guess is only reliable when the floor is photographed roughly head-on; a mask cannot give true perspective for angled shots, so the user can always drag the corners.

The brush (`MaskBrush`) paints floor in or out of the mask canvas directly. Brushing from a hand-drawn outline first turns that polygon into a mask.

The shader carries the photo's lighting onto the finish: it compares a blurred copy of the photo's luminance with the original floor's average (`src/lib/image/luminance.ts`) and brightens or darkens the finish to match. The blur comes from mipmaps, as does the soft mask edge.

All six Phase 2 tasks are built. The picture can also be zoomed and panned (`ZoomViewport`).

Out of scope until later phases: Supabase auth / saved projects / share links (Phase 3), before/after slider, download, photoreal AI mode, contractor features. Do not add these, or their dependencies, yet.

## Stack

- Next.js (App Router)
- TypeScript, strict mode
- Tailwind CSS
- WebGL2, hand-written (no Three.js; revisit when gloss/reflection work starts)
- Transformers.js (`@huggingface/transformers`) for in-browser segmentation
- pnpm, ESLint, Vitest
- Node 22.12 or newer (`.nvmrc` pins 24; run `nvm use` in a new shell)

## Folder structure

```
docs/SPEC.md             full product spec
public/                  static assets
src/app/                 layout.tsx, page.tsx, globals.css
src/components/          UI components, one per file
src/lib/image/           file/camera -> ImageBitmap, resize, mask drawing
src/lib/segmentation/     floor detection worker and its client
src/lib/geometry/        homography math (pure, unit-tested)
src/lib/gl/              WebGL2 program helpers, floor renderer, shaders
src/lib/templates/       epoxy template definitions and texture sources
src/types/               shared types (Point, Quad, Template)
```

## Coding rules

- Strict TypeScript: `strict: true` and `noUncheckedIndexedAccess`.
- No `any`. Use `unknown` and narrow, or define a proper type. Enforced by lint.
- Small, single-purpose components: one per file, roughly 150 lines at most. Split when a component grows past that.
- Pure logic (math, image processing, GL) lives in `src/lib` and does not import React.
- Add `"use client"` only to components that need browser APIs or state.
- Release every WebGL resource (programs, textures, buffers) on unmount.
- Nothing in the render path calls the server; switching templates must stay a GPU-only redraw (< 100 ms).
- Unit-test pure logic in `src/lib` with Vitest, with test files next to the source (`*.test.ts`).

## Commands

```
pnpm dev         # start the dev server
pnpm build       # production build
pnpm lint        # ESLint
pnpm test        # Vitest
pnpm typecheck   # tsc --noEmit
```
