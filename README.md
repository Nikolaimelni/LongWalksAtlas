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

Each trail is a hand-written JSON file in `data/trails/`, checked against a Zod schema.
The line itself comes from the trail's OpenStreetMap relation: `pnpm data` pulls it through
Overpass, drops variants and side trips, stitches the ways together, simplifies them and
writes `public/data/` plus `src/generated/trails-index.json`. Those outputs are committed,
so building the site needs no network. Raw Overpass responses are cached in `data/cache/`
(not committed); `pnpm data --refresh` downloads them again. The public Overpass servers
are often overloaded, so `.env` (copy `.env.example`) takes a list of endpoints to rotate
through. Trail geometry is OSM data, © OpenStreetMap contributors, ODbL.

The words live next to the data: `data/content/<slug>/<lang>.md`, a title, a one or two
sentence summary and a `status` (`machine` or `reviewed`) in the frontmatter, the trail's
story below it. English is required for every trail; any other language that is missing
falls back to it. `pnpm content` turns them into JSON and HTML under `src/generated/content/`
(not committed); `dev`, `build` and `typecheck` run it first.
