import { existsSync, readdirSync, readFileSync } from "node:fs";
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

const locales = readdirSync(new URL("../src/locales/", import.meta.url))
	.filter((file) => file.endsWith(".json"))
	.map((file) => file.replace(/\.json$/, ""));

// A language counts for a trail once the trail has its own text in it; until then its
// page in that language stays out of the alternates.
export const textLanguagesOf = (slug: string) =>
	locales.filter((lang) => {
		if (lang === "en") return true;
		if (
			existsSync(new URL(`../data/content/${slug}/${lang}.md`, import.meta.url))
		)
			return true;
		const file = new URL(`../data/translations/${lang}.json`, import.meta.url);
		return existsSync(file) && slug in JSON.parse(readFileSync(file, "utf8"));
	}).length;

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
