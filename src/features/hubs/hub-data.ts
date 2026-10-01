import type { Lang } from "~/features/i18n/languages";
import { loadContentIndex } from "~/features/trails/content";
import { lastChecked } from "~/features/trails/trail-files";
import { photos, trailsIndex } from "~/features/trails/trails-index";
import { type Hub, listHubs, trailsIn } from "./hubs";

export async function loadHub(hub: Hub, lang: Lang) {
	const content = await loadContentIndex(lang);
	const titleOf = (slug: string, original: string) =>
		content[slug]?.title ?? original;
	const trails = trailsIn(hub, trailsIndex)
		.map((summary) => ({
			summary,
			content: content[summary.slug] ?? null,
			photo: photos[summary.slug] ?? null,
		}))
		.sort((a, b) =>
			titleOf(a.summary.slug, a.summary.name.original).localeCompare(
				titleOf(b.summary.slug, b.summary.name.original),
				lang,
			),
		);
	return {
		hub,
		trails,
		hubs: listHubs(trailsIndex),
		checked: await lastChecked(trails.map((tr) => tr.summary.slug)),
	};
}

export type HubData = Awaited<ReturnType<typeof loadHub>>;
