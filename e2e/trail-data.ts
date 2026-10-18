import { readdirSync, readFileSync } from "node:fs";
import type { TrailSummary } from "../src/features/trails/trail-schema";

// The data the site was built from, so a check follows the trails as they are added
// instead of pinning today's counts.
export const trails: TrailSummary[] = JSON.parse(
	readFileSync(
		new URL("../src/generated/trails-index.json", import.meta.url),
		"utf8",
	),
);

export const countOf = (test: (trail: TrailSummary) => boolean) =>
	trails.filter(test).length;

export const publishedLanguages = readdirSync(
	new URL("../src/locales/", import.meta.url),
).filter((file) => file.endsWith(".json")).length;

const russian: Record<string, { title: string }> = JSON.parse(
	readFileSync(
		new URL("../data/translations/ru.json", import.meta.url),
		"utf8",
	),
);

// Machine translations get rewritten, so a check names a trail the way the site does.
export const ruTitle = (slug: string) => {
	const title = russian[slug]?.title;
	if (!title) throw new Error(`no Russian title for ${slug}`);
	return title;
};
