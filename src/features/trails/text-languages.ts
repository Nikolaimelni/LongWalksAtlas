import type { Lang } from "~/features/i18n/languages";
import { publishedLanguages } from "~/features/i18n/published";
import { loadContentIndex } from "./content";

// The published languages a trail has its own text in. Elsewhere its page shows the
// English text, and an English page under /ru/ would read as a duplicate to a search
// engine, so those pages stay out of the index until the text is translated.
export async function textLanguages(slug: string): Promise<Lang[]> {
	const found: Lang[] = [];
	for (const { code } of publishedLanguages) {
		const index = await loadContentIndex(code);
		if (index[slug]?.lang === code) found.push(code);
	}
	return found;
}
