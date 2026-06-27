import Fuse from "fuse.js";

export type SearchEntry = {
	slug: string;
	title: string;
	original: string;
	places: string[];
	countries: string[];
};

export function createSearch(entries: readonly SearchEntry[]) {
	const fuse = new Fuse(entries, {
		keys: [
			{ name: "title", weight: 2 },
			{ name: "original", weight: 2 },
			{ name: "places", weight: 1 },
			{ name: "countries", weight: 0.5 },
		],
		threshold: 0.35,
		ignoreLocation: true,
		ignoreDiacritics: true,
	});
	return (query: string): Set<string> | null => {
		const q = query.trim();
		if (!q) return null;
		return new Set(fuse.search(q).map((r) => r.item.slug));
	};
}
