# Long Walks Atlas

**[longwalksatlas.com](https://longwalksatlas.com)**

A world map of long-distance walking trails, from the Camino de Santiago to Te Araroa.
Tap a line for a photo and a short note, or open the trail's page for the full story
and a link to the official site.

It's a reference. There are no stages, huts or GPS tracks.

## Running it

Node 24 and pnpm.

```sh
pnpm install
pnpm dev
```

| Command             | What it does                                           |
| ------------------- | ------------------------------------------------------ |
| `pnpm build`        | Static site in `build/client`                          |
| `pnpm e2e`          | Builds, then runs the Playwright tests                 |
| `pnpm data`         | Fetches trail lines from OpenStreetMap (slow)          |
| `pnpm photos`       | Fetches photos and credits from Wikimedia Commons      |
| `pnpm flags`        | Copies the flags of the atlas's countries to `public/` |
| `pnpm translate`    | Fills missing translations with DeepL (key in `.env`)  |
| `pnpm build:deploy` | The build plus social cards, what the deploy job runs  |

## How it works

Every page is prerendered, one per trail per language, so search engines and AI
assistants get the text without running JavaScript.

A trail is a JSON file in `data/trails/` plus its English text in
`data/content/<slug>/en.md`. Machine translations sit in `data/translations/`, one file
per language. Map lines and photos are downloaded once and committed, so the build
needs no network.

The 186 trails were collected by an AI research agent and checked by hand.

Translations into 14 languages were made with DeepL and Claude. Nobody fluent has
read most of them, so expect the odd stiff sentence.

## Licence

Code is MIT. Trail texts are CC BY 4.0. Trail lines are © OpenStreetMap contributors,
ODbL. Each photo keeps its Wikimedia Commons licence and is credited on the page.
