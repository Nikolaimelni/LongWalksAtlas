import { type TrailFile, trailFileSchema } from "./trail-schema";

const files = import.meta.glob<unknown>("../../../data/trails/*.json", {
	import: "default",
});

export async function loadTrailFile(slug: string): Promise<TrailFile> {
	return trailFileSchema.parse(
		await files[`../../../data/trails/${slug}.json`]?.(),
	);
}
