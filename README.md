# NextFloor

See an epoxy floor finish on a photo of your own floor. Upload or take a photo, mark where the floor is, and pick a finish; the pattern is drawn onto the floor in the correct perspective, in the browser.

This is an early build. The full product plan is in [docs/SPEC.md](docs/SPEC.md).

## What works today

- **Photo input**: upload a file or use the device camera. Photos are resized in the browser so the long edge is at most 1024px.
- **Floor selection**: drag four corners onto the floor. For floors that are not a simple four-sided shape, add points to the outline; the outline can have any number of points and can be concave.
- **Live preview**: a WebGL2 shader tiles the chosen finish across the floor and warps it to match the photo's perspective. Switching finishes redraws on the GPU with no server call.
- **Three test finishes**: flake, metallic and quartz, generated in code. They are placeholders for real texture photos.
- **Compare**: a "Show original" toggle switches between the finish and the untouched photo.

Not built yet: automatic floor detection, keeping the photo's shadows and reflections on the new floor, saving and sharing, and accounts. See [Roadmap](#roadmap).

## How it works

Placing a pattern on a floor needs two pieces of information, and the editor keeps them separate.

1. **Perspective.** Four points that mark a rectangle on the real floor. From these the app computes a homography, a 3x3 matrix that maps any pixel in the photo to a position on the floor plane. This is what makes the pattern shrink towards the back of the room.
2. **Outline.** A polygon marking where the finish should appear. It is painted into a mask image.

For each pixel, the fragment shader maps the pixel onto the floor plane, samples the repeating finish texture there, and blends it over the photo wherever the mask is white. The two start out as the same four points and only separate when you add a point to the outline.

Blending is done in linear light, so the photo's colours pass through unchanged.

## Getting started

You need Node 22.12 or newer and [pnpm](https://pnpm.io). The repo pins Node 24 in `.nvmrc`.

```bash
nvm use
pnpm install
pnpm dev
```

Then open <http://localhost:3000>.

The live camera view needs HTTPS or `localhost`. If you open the dev server from a phone over plain HTTP on your local network, "Use camera" opens the phone's own camera app instead.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm typecheck` | Generate route types, then `tsc --noEmit` |

## Project layout

```
docs/SPEC.md           product spec
src/app/               Next.js App Router pages
src/components/        React components
src/lib/geometry/      homography and polygon maths
src/lib/gl/            WebGL2 renderer and shaders
src/lib/image/         photo decoding, resizing, mask drawing
src/lib/templates/     the epoxy finishes
src/types/             shared types
```

Code in `src/lib` has no React dependency. The geometry, resize and random-number code is covered by unit tests that sit next to the source as `*.test.ts`.

## Stack

Next.js 16 (App Router), React 19, TypeScript in strict mode, Tailwind CSS 4, and hand-written WebGL2 with no 3D library.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Upload, manual floor selection, WebGL texture overlay | Built |
| 2 | Automatic floor detection in the browser, mask refinement | Next |
| 3 | Accounts, saved projects, share links | Planned |
| 4 | Polish, mobile, deployment | Planned |
| 5 | Photoreal AI render, contractor features | Stretch |
