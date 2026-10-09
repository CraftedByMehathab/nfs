# NextFloor

Epoxy floor visualizer: snap or upload a photo of a floor, pick an epoxy design, and see the finished floor in seconds. Full spec: [docs/SPEC.md](docs/SPEC.md).

@AGENTS.md

## Project summary

Pipeline (full product): capture photo -> detect floor -> fit 4 corners to a homography -> tile the template texture in a WebGL shader, warped by the homography and clipped to the floor -> blend original lighting -> compare, download, share.

**Current phase: Phase 1 — Core Overlay.** Upload or camera capture, client-side resize to ~1024px, manual 4-corner floor selection, WebGL2 shader that tiles and warps a texture into the selected area, and 3 test epoxy textures.

Out of scope until later phases: auto segmentation (Phase 2), Supabase auth / saved projects / share links (Phase 3), luminance blending, before/after slider, download, photoreal AI mode, contractor features. Do not add these, or their dependencies, during Phase 1.

## Stack

- Next.js (App Router)
- TypeScript, strict mode
- Tailwind CSS
- WebGL2, hand-written (no Three.js; revisit when gloss/reflection work starts)
- pnpm, ESLint, Vitest
- Node 22.12 or newer (`.nvmrc` pins 24; run `nvm use` in a new shell)

## Folder structure

```
docs/SPEC.md             full product spec
public/                  static assets
src/app/                 layout.tsx, page.tsx, globals.css
src/components/          UI components, one per file
src/lib/image/           file/camera -> ImageBitmap, resize
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
