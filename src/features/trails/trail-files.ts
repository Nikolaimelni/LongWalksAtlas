import { type TrailFile, trailFileSchema } from "./trail-schema";

const files = import.meta.glob<unknown>("../../../data/trails/*.json", {
	import: "default",
});

export async function loadTrailFile(slug: string): Promise<TrailFile> {
	return trailFileSchema.parse(
		await files[`../../../data/trails/${slug}.json`]?.(),
	);
}

// The newest fact check among some trails: when a page listing them last changed.
export async function lastChecked(slugs: readonly string[]): Promise<string> {
	const files = await Promise.all(slugs.map(loadTrailFile));
	return (
		files
			.map((f) => f.verifiedAt)
			.sort()
			.at(-1) ?? ""
	);
}
