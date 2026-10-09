# NextFloor

Epoxy floor visualizer: snap or upload a photo of a floor, pick an epoxy design, and see the finished floor in seconds. Full spec: [docs/SPEC.md](docs/SPEC.md).

@AGENTS.md

## Project summary

Pipeline (full product): capture photo -> detect floor -> fit 4 corners to a homography -> tile the template texture in a WebGL shader, warped by the homography and clipped to the floor -> blend original lighting -> compare, download, share.

**Current phase: Phase 5 — contractor features.** Phases 1 to 4 are built. Photoreal AI mode, the other half of Phase 5, has not been started. Phase 1: upload or camera capture, resize to ~1024px, manual floor selection, WebGL2 overlay, the first finishes. Phase 2: floor detection, brush, lighting. Phase 3: the before/after divider, JPEG download, Google sign-in (the only sign-in method), saving, share links and a projects page. A saved picture reopens in the editor from its Edit link (`/?render=<id>`, loaded by `src/lib/projects/open.ts`), and saving from there replaces that picture instead of adding one.

The app is deployed on Vercel at https://nfs-pied.vercel.app, from the GitHub repo: a merge to `main` deploys to production and each pull request gets a preview. It uses a cloud Supabase project that has the schema applied; Google sign-in and share links work against that project from a local dev server. Saving, sharing and reopening have automated browser checks against a local Supabase only, and on the deployed site only the signed-out pages have been checked.

From Phase 4, the catalogue has ten finishes (flake, metallic, quartz and solid), each painted in code by `src/lib/templates`. The picker shows one category at a time, chosen with tabs. A finish must also be a row in the `templates` table, added by a migration, or pictures using it cannot be saved; `catalogue.test.ts` checks the two agree. Apply new migrations to the cloud project (`supabase db push`) before merging, because a merge to `main` deploys.

On a phone held upright the editor's picture stays at the top of the screen while the controls scroll under it (`.picture-dock` in `globals.css`), and every control is at least 44px, the smallest size a finger hits reliably; use the shared classes in `buttonStyles.ts` for new buttons and links.

The live site scored 98 for performance on Lighthouse's mobile test on 2026-10-09 (home and projects pages, one run each), against a target of 90. A first draft of the case study is in `docs/CASE_STUDY.md`; it still needs screenshots of real floors.

The selection has two parts. The **perspective** is always exactly four corners marking a rectangle on the floor; it gives the homography. The **outline** says where the finish is shown; it is a mask texture that the shader clips to. The mask comes either from a hand-drawn polygon of three or more points, or from floor detection.

Floor detection runs SegFormer-B0 (ADE20K) through Transformers.js in a web worker (`src/lib/segmentation/`). It uses WebGPU when available and WebAssembly otherwise. The model is downloaded from huggingface.co and the ONNX runtime from jsDelivr on first use. The worker keeps only the floor class from the model's low-resolution output; the main thread stretches that to the photo's size. Add `?segmentation=wasm` or `?segmentation=webgpu` to the URL to force a backend when benchmarking.

After detection, `fitQuadToMask` (`src/lib/geometry/fitQuad.ts`) guesses the perspective corners from the mask. The guess is only reliable when the floor is photographed roughly head-on; a mask cannot give true perspective for angled shots, so the user can always drag the corners.

The brush (`MaskBrush`) paints floor in or out of the mask canvas directly. Brushing from a hand-drawn outline first turns that polygon into a mask.

The shader carries the photo's lighting onto the finish: it compares a blurred copy of the photo's luminance with the original floor's average (`src/lib/image/luminance.ts`) and brightens or darkens the finish to match. The blur comes from mipmaps, as does the soft mask edge.

All six Phase 2 tasks are built. The picture can also be zoomed and panned (`ZoomViewport`).

Out of scope for now: photoreal AI mode. Do not add it, or its dependencies, yet.

## Phase 5: contractor features

Built so far: the contractor page. A signed-in user sets up one page at `/contractor` (business name, address, header colour, optional contact email and phone), stored as a row in `contractors`. Visitors open it at `/c/<slug>`, which shows the same editor under the contractor's name. The page is read through the `get_contractor` function, so signed-out visitors can open a page they have the address of but cannot list contractors. The logic is in `src/lib/contractors/`.

Any signed-in user can set up a contractor page; a user is a contractor if they have a row in `contractors`. There is no approval step or plan.

Still to build, in this order: a "request a quote" form on the contractor page with a leads inbox for the contractor, a logo, the contractor's own finishes, and an embeddable widget.

## Phase 3 decisions

- Sign-in is Google only. Email sign-in is switched off in `supabase/config.toml`; switch the Email provider off in any cloud project too.
- Saving and sharing need an account. Signed-out visitors can use the whole editor and download, but not save or share.
- A share link shows the finished picture only, not the original photo.
- Auth is entirely client-side (`src/lib/supabase/client.ts`, `useSession`): the session lives in the browser, and row-level security is what protects data. There is no server session, proxy or auth route handler. Sign-in finishes in a popup (`/auth/complete`) so the editor keeps its unsaved picture.
- Without `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` the account features hide themselves and the editor still works.
- The schema is in `supabase/migrations/`. A project stores the photo, the four perspective corners, and either a mask image or an outline polygon. Files live in private buckets under `<user_id>/`; sharing copies the picture to a public bucket under a random slug.

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
src/lib/supabase/         Supabase clients
src/lib/projects/         saving, sharing and listing saved pictures
src/lib/contractors/      contractor pages: address, colour, loading and saving
src/lib/geometry/        homography math (pure, unit-tested)
src/lib/gl/              WebGL2 program helpers, floor renderer, shaders
src/lib/templates/       epoxy template definitions and texture sources
src/types/               shared types (Point, Quad, Template)
supabase/migrations/     database schema, row-level security, storage buckets
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
pnpm db:start    # local Supabase in Docker (API on :54321, Studio on :54323)
pnpm db:reset    # wipe the local database and reapply the migrations
pnpm db:types    # regenerate src/types/database.ts from the local database
```
