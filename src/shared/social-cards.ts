import type { MetaDescriptor } from "react-router";
import type { TrailPhoto } from "~/features/trails/trail-schema";
import cards from "~/generated/og.json";
import { absoluteUrl } from "./site";

type Card = { src: string; width: number; height: number };

type ByLang = Record<string, Card | undefined>;

// why: written by scripts/build-og.ts; the JSON import types only the languages and
// trails it held at the last `pnpm og`, and a trail added since has no card yet.
const index = cards as {
	atlas: ByLang;
	trails: Record<string, ByLang | undefined>;
};

function cardMeta(card: Card): MetaDescriptor[] {
	return [
		{ property: "og:image", content: absoluteUrl(card.src) },
		{ property: "og:image:width", content: String(card.width) },
		{ property: "og:image:height", content: String(card.height) },
		{ name: "twitter:card", content: "summary_large_image" },
	];
}

export function atlasCardMeta(lang: string): MetaDescriptor[] {
	const card = index.atlas[lang] ?? index.atlas.en;
	return card ? cardMeta(card) : [{ name: "twitter:card", content: "summary" }];
}

// The card made from the trail's photo, title and facts in this language, if `pnpm og`
// has made one. An English card on a Russian page would be worse than the bare photo.
export function trailCardMeta(
	slug: string,
	lang: string,
): MetaDescriptor[] | null {
	const card = index.trails[slug]?.[lang];
	return card ? cardMeta(card) : null;
}

export function photoCardMeta(photo: TrailPhoto): MetaDescriptor[] {
	return cardMeta({
		src: photo.src.large,
		width: photo.width,
		height: photo.height,
	});
}
