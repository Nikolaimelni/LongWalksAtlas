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
- `data/content/<slug>/en.md`: the English text of each trail, read and marked
  `reviewed`. A `<lang>.md` next to it is a person's translation and always wins.
- `data/translations/<lang>.json`: machine translations from `pnpm translate` (DeepL, key
  in `.env`), one file per language.

Where no source gives the days on foot, they are worked out from the length at 20 to 25
km a day, shown with "≈" and a note saying so, and left out of the JSON-LD.

`pnpm og` builds the site and photographs the social card of the atlas in each
language. `pnpm og --trails` also makes one card per trail and language, close to a
thousand JPEGs, so they are not made by default; a trail page without one uses its photo.

Most trails came from a research run by another agent (`data/collection-brief.md`),
then checked by hand and brought in with `scripts/import-trails.ts`. A quarter of them
had a start or end several kilometres off the OSM line, which quietly breaks the line.

## Known issues

- Lines are schematic. Where the OSM relation is incomplete (Lebanon Mountain Trail,
  Juliana Trail) the line is too.
- Five trails from the research run are left out: no usable OSM relation yet.
- Every non-English text is a machine translation nobody has read.
- Days on foot are an estimate for about half the trails, and for a climb like
  Kilimanjaro the estimate from the length is far too short.

Trail geometry © OpenStreetMap contributors, ODbL.
