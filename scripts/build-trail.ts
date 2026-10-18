import { bbox } from "@turf/bbox";
import { length } from "@turf/length";
import { simplify } from "@turf/simplify";
import type { Feature, MultiLineString, Position } from "geojson";
import { estimateDays } from "../src/features/trails/day-estimate.ts";
import type {
	TrailFile,
	TrailSummary,
} from "../src/features/trails/trail-schema.ts";

export type TrailFeature = Feature<
	MultiLineString,
	{ slug: string; type: TrailFile["type"] }
>;

const atlasTolerance = 0.003;
const detailTolerance = 0.0003;

export function buildTrail(trail: TrailFile, lines: Position[][]) {
	const feature: TrailFeature = {
		type: "Feature",
		properties: { slug: trail.slug, type: trail.type },
		geometry: { type: "MultiLineString", coordinates: lines },
	};
	const osmKm = length(feature, { units: "kilometers" });
	const lengthKm = trail.lengthKm ?? Math.round(osmKm);
	const [west = 0, south = 0, east = 0, north = 0] = bbox(feature);

	const summary: TrailSummary = {
		slug: trail.slug,
		name: trail.name,
		type: trail.type,
		region: trail.region,
		start: trail.start,
		end: trail.end,
		countries: trail.countries,
		bestSeason: trail.bestSeason,
		badges: trail.badges,
		lengthKm,
		lengthSource: trail.lengthKm === null ? "osm" : "official",
		days: trail.days ?? estimateDays(lengthKm),
		daysSource: trail.days === null ? "estimate" : "official",
		bbox: [round(west, 4), round(south, 4), round(east, 4), round(north, 4)],
		crosses: [],
		nearby: [],
	};

	return {
		summary,
		osmKm,
		atlas: reduce(feature, atlasTolerance, 4),
		detail: reduce(feature, detailTolerance, 5),
	};
}

function reduce(
	feature: TrailFeature,
	tolerance: number,
	digits: number,
): TrailFeature {
	const simple = simplify(feature, { tolerance });
	const coordinates = simple.geometry.coordinates
		.map((line) =>
			dedupe(
				line.map(([lng = 0, lat = 0]) => [
					round(lng, digits),
					round(lat, digits),
				]),
			),
		)
		.filter((line) => line.length >= 2);
	return { ...simple, geometry: { type: "MultiLineString", coordinates } };
}

function dedupe(line: Position[]): Position[] {
	return line.filter(
		(p, i) => i === 0 || p[0] !== line[i - 1]?.[0] || p[1] !== line[i - 1]?.[1],
	);
}

function round(value: number, digits: number): number {
	const f = 10 ** digits;
	return Math.round(value * f) / f;
}
