# Long Walks Atlas

A map of long-distance walking trails: pilgrim ways, historic routes, coastal and
mountain paths. Tap a line for a photo and a short note, open the trail's page for the
story, the facts and a link to the official site. A reference, not a planner: no stages,
no beds, no GPS tracks.

The site is fully static and built to be found through search engines and AI
assistants, so every trail, country and trail type gets its own prerendered page in
each language, with JSON-LD, hreflang and the facts as plain text.

```sh
pnpm install
pnpm dev
```

Node 24 and pnpm. `pnpm build` writes the site to `build/client`, `pnpm e2e` builds it and
runs Playwright against it.

## Where the data comes from

- `data/trails/<slug>.json`: one file per trail, checked by a Zod schema.
- `pnpm data`: pulls each trail's line from its OpenStreetMap relation and writes
  `public/data/`. Slow, since Overpass is often overloaded; the output is committed so a
  build needs no network.
- `pnpm photos`: Wikimedia Commons file named in the trail JSON, credit and licence read
  from Commons, NC and ND refused.
- `data/content/<slug>/<lang>.md`: the texts. English is written (or imported), the
  rest comes from `pnpm translate` (DeepL, key in `.env`) and is marked `machine` until
  someone reads it.

Most trails came from a research run by another agent (`data/collection-brief.md`),
then checked by hand and brought in with `scripts/import-trails.ts`. A quarter of them
had a start or end several kilometres off the OSM line, which quietly breaks the line.

## Known issues

- Lines are schematic. Where the OSM relation is incomplete (Lebanon Mountain Trail,
  Juliana Trail) the line is too.
- Five trails from the research run are left out: no usable OSM relation yet.
- Every non-English text is a machine translation nobody has read.
- One Markdown file per trail per language adds up to hundreds of small files. I would
  keep machine translations in one file per language next time.

Trail geometry © OpenStreetMap contributors, ODbL.
