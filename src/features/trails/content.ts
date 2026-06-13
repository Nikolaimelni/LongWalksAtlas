import type { Lang } from "~/features/i18n/languages";
import type { TrailContent } from "./content-schema";

const indexes = import.meta.glob<Record<string, TrailContent>>(
	"../../generated/content/*.json",
	{ import: "default" },
);
const bodies = import.meta.glob<string>("../../generated/content/*/*.html", {
	query: "?raw",
	import: "default",
});

export async function loadContentIndex(
	lang: Lang,
): Promise<Record<string, TrailContent>> {
	return (await indexes[`../../generated/content/${lang}.json`]?.()) ?? {};
}

export async function loadContentBody(
	lang: Lang,
	slug: string,
): Promise<string | null> {
	return (
		(await bodies[`../../generated/content/${lang}/${slug}.html`]?.()) ?? null
	);
}
