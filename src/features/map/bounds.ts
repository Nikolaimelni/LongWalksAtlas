import type { TrailSummary } from "~/features/trails/trail-schema";

export type Bounds = [
	[west: number, south: number],
	[east: number, north: number],
];

export function boundsOf(
	trails: readonly Pick<TrailSummary, "bbox">[],
): Bounds {
	const [west, south, east, north] = trails.reduce(
		([w, s, e, n], { bbox }) => [
			Math.min(w, bbox[0]),
			Math.min(s, bbox[1]),
			Math.max(e, bbox[2]),
			Math.max(n, bbox[3]),
		],
		[180, 90, -180, -90],
	);
	return [
		[west, south],
		[east, north],
	];
}
