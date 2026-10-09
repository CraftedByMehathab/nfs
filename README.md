# NextFloor

See an epoxy floor finish on a photo of your own floor. Upload or take a photo, mark where the floor is, and pick a finish; the pattern is drawn onto the floor in the correct perspective, in the browser.

This is an early build. The full product plan is in [docs/SPEC.md](docs/SPEC.md).

## What works today

- **Photo input**: upload a file or use the device camera. Photos are resized in the browser so the long edge is at most 1024px.
- **Floor detection**: one click finds the floor with a segmentation model (SegFormer) running in the browser, on WebGPU where available and WebAssembly otherwise. No photo leaves the device.
- **Manual selection**: drag four corners onto the floor. For floors that are not a simple four-sided shape, add points to the outline; the outline can have any number of points and can be concave.
- **Brush**: paint floor in or out to fix the detected or drawn area.
- **Realistic lighting**: the photo's shadows and highlights carry onto the new finish, with soft edges where it meets the walls.
- **Zoom**: zoom to 400% and pan for precise corner placement and brushing.
- **Live preview**: a WebGL2 shader tiles the chosen finish across the floor and warps it to match the photo's perspective. Switching finishes redraws on the GPU with no server call.
- **Three test finishes**: flake, metallic and quartz, generated in code. They are placeholders for real texture photos.
- **Compare**: a "Show original" toggle switches between the finish and the untouched photo.

Not built yet: glossy reflections, a before/after slider, download, saving and sharing, and accounts. See [Roadmap](#roadmap).

Floor detection gives the outline of the floor but only a rough guess at its perspective. For a photo taken at an angle, drag the four orange corners onto a rectangle on the floor.

## How it works

Placing a pattern on a floor needs two pieces of information, and the editor keeps them separate.

1. **Perspective.** Four points that mark a rectangle on the real floor. From these the app computes a homography, a 3x3 matrix that maps any pixel in the photo to a position on the floor plane. This is what makes the pattern shrink towards the back of the room.
2. **Outline.** A mask image marking where the finish should appear. It comes from the detection model, from a polygon you draw, or from the brush.

For each pixel, the fragment shader maps the pixel onto the floor plane, samples the repeating finish texture there, and blends it over the photo wherever the mask is white. In manual mode the two start out as the same four points and only separate when you add a point to the outline.

To keep the lighting, the shader compares a blurred copy of the photo's brightness with the original floor's average brightness, and darkens or brightens the finish by that ratio. Blending is done in linear light, so the photo's colours pass through unchanged.

Detection runs in a web worker. The first use downloads the model from huggingface.co (4 to 15 MB) and the ONNX runtime from the jsDelivr CDN; the browser caches both.

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
src/lib/image/         photo decoding, resizing, masks, luminance
src/lib/segmentation/  floor detection worker and its client
src/lib/templates/     the epoxy finishes
src/types/             shared types
```

Code in `src/lib` has no React dependency. The geometry, mask, luminance and detection post-processing code is covered by unit tests that sit next to the source as `*.test.ts`.

## Stack

Next.js 16 (App Router), React 19, TypeScript in strict mode, Tailwind CSS 4, hand-written WebGL2 with no 3D library, and Transformers.js for in-browser segmentation.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Upload, manual floor selection, WebGL texture overlay | Built |
| 2 | Automatic floor detection in the browser, mask refinement, lighting | Built |
| 3 | Accounts, saved projects, share links | Next |
| 4 | Polish, mobile, deployment | Planned |
| 5 | Photoreal AI render, contractor features | Stretch |
