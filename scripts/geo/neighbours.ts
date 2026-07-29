import type { Position } from "geojson";
import { lineDistanceKm } from "./line-distance.ts";

type Built = {
	slug: string;
	bbox: [number, number, number, number];
	lines: Position[][];
};

const crossKm = 1;
const nearKm = 50;
const maxNearby = 4;

function boxesNear(a: Built["bbox"], b: Built["bbox"]): boolean {
	const padLat = nearKm / 110.57;
	const poleward = Math.max(
		Math.abs(a[1]),
		Math.abs(a[3]),
		Math.abs(b[1]),
		Math.abs(b[3]),
	);
	const padLng =
		nearKm / (111.32 * Math.cos((Math.min(poleward, 85) * Math.PI) / 180));
	return (
		a[0] - padLng <= b[2] &&
		b[0] - padLng <= a[2] &&
		a[1] - padLat <= b[3] &&
		b[1] - padLat <= a[3]
	);
}

export function findNeighbours(
	trails: readonly Built[],
): Map<string, { crosses: string[]; nearby: string[] }> {
	const found = new Map(
		trails.map((t) => [t.slug, [] as { slug: string; km: number }[]]),
	);
	for (const [i, a] of trails.entries()) {
		for (const b of trails.slice(i + 1)) {
			if (!boxesNear(a.bbox, b.bbox)) continue;
			const km = lineDistanceKm(a.lines, b.lines, nearKm);
			if (km === null) continue;
			found.get(a.slug)?.push({ slug: b.slug, km });
			found.get(b.slug)?.push({ slug: a.slug, km });
		}
	}

	return new Map(
		[...found].map(([slug, list]) => {
			const sorted = list.sort((x, y) => x.km - y.km);
			return [
				slug,
				{
					crosses: sorted.filter((n) => n.km <= crossKm).map((n) => n.slug),
					nearby: sorted
						.filter((n) => n.km > crossKm)
						.slice(0, maxNearby)
						.map((n) => n.slug),
				},
			];
		}),
	);
}
