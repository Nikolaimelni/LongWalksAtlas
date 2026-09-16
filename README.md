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

`pnpm build` writes a fully static site to `build/client`: the atlas and every trail page
prerendered in each published language (`/en/`, `/ru/trail/lycian-way/` and so on), `/`,
which sends the visitor to the language their browser asks for, plus `sitemap.xml`,
`llms.txt` and a `404.html`. Search engines and AI assistants are the main way people
will find the site, so each page carries its canonical URL, hreflang links to its
translations and schema.org JSON-LD, and the facts are on the page as text, not only on
the map.

After the build, `scripts/add-csp.ts` gives every page a Content-Security-Policy `<meta>`.
React Router writes several inline scripts into each prerendered page, different on every
page, so the policy lists their hashes rather than allowing inline script wholesale;
`public/_headers` adds `frame-ancestors`, which a meta tag cannot carry, and HSTS. The
only other origin the browser may talk to is OpenFreeMap. `pnpm dev` runs without the
policy, so a page that breaks it shows up in `pnpm preview` and the e2e run, not in dev.

The site follows the device's light or dark setting, basemap included (OpenFreeMap's
positron and dark styles). Each theme has its own set of trail colours, and a test holds
every colour to 3:1 contrast against both the land and the water of its basemap; the
first light palette failed that for the pilgrim ways and nobody had noticed.

On the atlas, search (fuzzy and accent-blind, so "oludeniz" finds Ölüdeniz) and the
filters for type, country, length and days live in the query string, so a filtered view
is a link you can send. The trail list is part of the prerendered page; on a phone it
folds into a bar under the map.

A shared link to the atlas shows a card made from the real map: `pnpm og` builds the site,
photographs `/<lang>/og-card/` (a 1200 × 630 page kept out of search) for each published
language with Playwright, and writes the JPEGs to `public/og/`, committed. A trail page
uses its photo, or the atlas card while it has none. The favicon and the touch icon are
the logo mark on a brand-coloured disc, written by `pnpm icons` and committed too.

`pnpm preview` serves `build/client` the way the host will: files as they are, `/en`
redirected to `/en/`, and `404.html` with a real 404 for anything else (`vite preview`
would answer unknown paths with the home page). `pnpm e2e` builds, serves through it and
runs the Playwright checks on a phone viewport and a desktop one (`pnpm exec playwright
install chromium` once beforehand).

Each trail is a hand-written JSON file in `data/trails/`, checked against a Zod schema.
The line itself comes from the trail's OpenStreetMap relation: `pnpm data` pulls it through
Overpass, drops variants and side trips, stitches the ways together, simplifies them and
writes `public/data/` plus `src/generated/trails-index.json`. Those outputs are committed,
so building the site needs no network. Raw Overpass responses are cached in `data/cache/`
(not committed); `pnpm data --refresh` downloads them again. The public Overpass servers
are often overloaded, so `.env` (copy `.env.example`) takes a list of endpoints to rotate
through. Trail geometry is OSM data, © OpenStreetMap contributors, ODbL.

A trail's photo is named by its Wikimedia Commons file in the trail JSON, nothing else.
`pnpm photos` asks Commons for the author and licence (refusing NC and ND files), so the
credit printed under the photo always matches the file page, then writes 640 and 1280 px
WebP copies to `public/photos/` and the credits to `src/generated/photos.json`. Both are
committed, like the geometry.

The words live next to the data: `data/content/<slug>/<lang>.md`, a title, a one or two
sentence summary and a `status` (`machine` or `reviewed`) in the frontmatter, the trail's
story below it. English is required for every trail; any other language that is missing
falls back to it. `pnpm content` turns them into JSON and HTML under `src/generated/content/`
(not committed); `dev`, `build` and `typecheck` run it first. That HTML goes into the page
as it is, so a tag outside a short list (paragraphs, emphasis, lists, h3 and h4, links) or
a link that is not http, https or mailto stops the build, DeepL's output included.

`pnpm translate` fills the gaps with DeepL (`DEEPL_API_KEY` in `.env`; `--dry-run` shows
what would be sent without one). Interface strings keep their `{{placeholders}}`, and
plural forms are built per language from CLDR rules: each form is translated from a
phrase with a number that falls into it (22 дня, 25 дней), then the number goes back to
`{{count}}`. Trail texts are only written where a language has no file yet, marked
`status: machine`, and a reviewed file is never touched. A language only goes on the
site, with its pages, sitemap entries, hreflang links and a place in the switcher, once
`src/locales/<lang>.json` exists; English pages under a German URL would read as
duplicates to a search engine. Today that means English and Russian.
