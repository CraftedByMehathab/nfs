# NextFloor: see an epoxy floor before you pay for it

**Live:** https://nfs-pied.vercel.app · **Code:** https://github.com/CraftedByMehathab/nfs

NextFloor shows a homeowner what an epoxy finish would look like on their own floor. They take a photo, the app finds the floor, and they flip through finishes that are drawn onto the photo in the right perspective and with the room's own light and shadow. Everything up to saving happens in the browser: the photo is not uploaded until the user chooses to save it.

## The problem

An epoxy floor is expensive, permanent, and sold from small sample chips. A chip tells you little about how a metallic swirl or a dark flake will look across a whole garage. Contractors lose time to customers who cannot decide, and customers commit to a finish they have only imagined.

## How it works

1. **Capture.** Upload a photo or use the camera. The photo is resized to about 1024 px in the browser.
2. **Find the floor.** A segmentation model (SegFormer-B0, trained on ADE20K) runs in a web worker through Transformers.js. It uses WebGPU where the browser has it and WebAssembly otherwise.
3. **Set the perspective.** Four corners marking a rectangle on the floor give a homography, the mapping between the flat floor and its shape in the photo. The app guesses the corners from the detected floor and the user can drag them.
4. **Draw the finish.** A hand-written WebGL2 shader tiles the finish across the floor plane, warps it with the homography, and clips it to the floor mask.
5. **Keep the room's light.** The shader compares a blurred copy of the photo's brightness with the floor's average brightness, and lightens or darkens the finish to match, so shadows and window light stay where they were.
6. **Compare, save, share.** A before/after divider, JPEG download, saved projects behind Google sign-in, and public share links.

## Decisions that shaped it

**Perspective and outline are separate things.** The obvious design uses one four-cornered shape for both. But real floors are not four-cornered: they run behind cars and around cabinets. So the selection has two parts. The perspective is always exactly four corners and only sets the mapping. The outline is a mask that says where the finish shows, and it can come from the model, a hand-drawn polygon, or a brush.

**The model runs on the user's device.** A server model would be more accurate, but it would cost money per photo and add a round trip. Running SegFormer-B0 in the browser costs nothing per use and keeps the photo private. Where the model is wrong, the brush lets the user paint floor in or out, so a smaller model is good enough.

**Changing finish never touches the network.** Finishes are painted in code as seamless tiles and cached as textures, so switching is a single GPU redraw. This is what makes the product feel like trying things on, not like submitting a form.

**No server session.** Sign-in is handled entirely in the browser by Supabase, and row-level security in Postgres is what protects each user's data. Sign-in opens in a popup so the picture being edited is not lost to a redirect.

## Two bugs worth telling

**The brush strokes that came back wrong.** After reopening a saved picture, recent brush strokes were missing. The mask was being saved correctly, but always to the same file name, and storage serves files with a one-hour cache header. The browser was showing an older copy. Each save now writes the mask to a new file and removes the old one.

**The second edit that crashed.** Opening a saved picture worked once and failed the second time. The framework keeps a page's state while you visit another page, but runs its cleanup code on the way out. My cleanup released the photo's memory while the state still pointed at it. My scripted browser checks had missed this because they reloaded the page between steps, which wipes that state. The fix was small. The lasting change was to make the checks move between pages by clicking links, the way a person does.

## Results

| Measure | Target | Result |
|---|---|---|
| Floor detection | under 2 s | 158–300 ms per photo on WebGPU, after a one-time model load of about 0.6 s |
| Changing finish | under 100 ms | 59–82 ms, measured with software rendering, the slowest case |
| Lighthouse, mobile | 90 or more | 98 performance; 100 accessibility, best practices and SEO |

Detection times are from my development machine with WebGPU. The first visit also downloads the model, which is not included. Lighthouse was run once against the live home page and projects page.

The catalogue has ten finishes across flake, metallic, quartz and solid colours. On a phone the picture stays in view while the controls scroll beneath it, and every control is at least 44 px.

## What I would do next

- **Photographed finishes.** The finishes are generated in code. Real product photos would look more convincing and are what a contractor would want to show.
- **Gloss and reflection.** Epoxy is shiny. The shader carries the room's light onto the finish but does not yet reflect it.
- **A price estimate.** With the floor plane known and one real measurement from the user, the app could work out the area and a rough cost.
- **Contractor accounts.** Their own finishes and branding, and an inbox for the customers who share a picture with them.

## Stack

Next.js (App Router) and TypeScript in strict mode, Tailwind CSS, hand-written WebGL2, Transformers.js, Supabase (Postgres, Auth, Storage), Vercel. Unit tests with Vitest.
