# Long Walks Atlas

A map of long-distance walking routes: pilgrim ways, historic paths, coastal and mountain
trails, the E-paths. Europe and Turkey first, the rest of the world later. Tap a line to
see a photo and a short note about the trail, then open its page for the full story and a
link to the official site.

It is a reference, not a planner: no stages, no beds, no GPS tracks.

## Running it

Node 24 (see `.nvmrc`) and pnpm.

```sh
pnpm install
pnpm dev
```

`pnpm build` writes a fully static site to `build/client`: one prerendered page per
language (`/en/`, `/ru/`, `/ar/` and so on), plus `/`, which sends the visitor to the
language their browser asks for. `pnpm e2e` builds, serves the result and runs the
Playwright checks on a phone viewport and a desktop one (`pnpm exec playwright install
chromium` once beforehand).
