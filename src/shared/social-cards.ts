import type { MetaDescriptor } from "react-router";
import type { TrailPhoto } from "~/features/trails/trail-schema";
import cards from "~/generated/og.json";
import { absoluteUrl } from "./site";

type Card = { src: string; width: number; height: number };

// why: written by scripts/build-og.ts; the JSON import types only the languages it holds.
const atlasCards = cards as Record<string, Card | undefined>;

export function atlasCardMeta(lang: string): MetaDescriptor[] {
	const card = atlasCards[lang] ?? atlasCards.en;
	if (!card) return [{ name: "twitter:card", content: "summary" }];
	return [
		{ property: "og:image", content: absoluteUrl(card.src) },
		{ property: "og:image:width", content: String(card.width) },
		{ property: "og:image:height", content: String(card.height) },
		{ name: "twitter:card", content: "summary_large_image" },
	];
}

export function photoCardMeta(photo: TrailPhoto): MetaDescriptor[] {
	return [
		{ property: "og:image", content: absoluteUrl(photo.src.large) },
		{ property: "og:image:width", content: String(photo.width) },
		{ property: "og:image:height", content: String(photo.height) },
		{ name: "twitter:card", content: "summary_large_image" },
	];
}
