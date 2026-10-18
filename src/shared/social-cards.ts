import type { MetaDescriptor } from "react-router";
import type { TrailPhoto } from "~/features/trails/trail-schema";
import { absoluteUrl } from "./site";

type Card = { src: string; width: number; height: number };

function cardMeta(card: Card): MetaDescriptor[] {
	return [
		{ property: "og:image", content: absoluteUrl(card.src) },
		{ property: "og:image:width", content: String(card.width) },
		{ property: "og:image:height", content: String(card.height) },
		{ name: "twitter:card", content: "summary_large_image" },
	];
}

// Made by scripts/build-og.ts straight into build/client/og/ on every deploy build,
// under a fixed name, so a page can point at it before it exists.
export function atlasCardMeta(lang: string): MetaDescriptor[] {
	return cardMeta({ src: `/og/atlas-${lang}.jpg`, width: 1200, height: 630 });
}

export function photoCardMeta(photo: TrailPhoto): MetaDescriptor[] {
	return cardMeta({
		src: photo.src.large,
		width: photo.width,
		height: photo.height,
	});
}
