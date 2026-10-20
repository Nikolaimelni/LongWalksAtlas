import {
	type TrailFile,
	type TrailPhoto,
	trailFileSchema,
} from "./trail-schema";

const files = import.meta.glob<unknown>("../../../data/trails/*.json", {
	import: "default",
});

export async function loadTrailFile(slug: string): Promise<TrailFile> {
	return trailFileSchema.parse(
		await files[`../../../data/trails/${slug}.json`]?.(),
	);
}

export async function loadGallery(slug: string): Promise<TrailPhoto[]> {
	// why: written by scripts/build-photos.ts from a Zod-checked record; the JSON import
	// only loses the exact types.
	const { default: gallery } = (await import("~/generated/gallery.json")) as {
		default: unknown;
	};
	return (gallery as Record<string, TrailPhoto[]>)[slug] ?? [];
}
