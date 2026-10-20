import { describe, expect, it } from "vitest";
import type { TrailFile } from "../src/features/trails/trail-schema.ts";
import { buildTrail } from "./build-trail.ts";

const trail: TrailFile = {
	slug: "test-way",
	name: { original: "Test Way" },
	type: "coastal",
	region: "europe",
	start: { name: "A", coords: [10, 45] },
	end: { name: "B", coords: [11, 45] },
	countries: ["IT"],
	lengthKm: null,
	days: null,
	bestSeason: ["may"],
	badges: [],
	officialUrl: "https://example.org/",
	sources: ["https://example.org/"],
	photo: null,
	morePhotos: [],
	wikidata: null,
	geometry: { source: "osm", relationIds: [1] },
};

const line = Array.from({ length: 101 }, (_, i) => [10 + i / 100, 45]);

describe("buildTrail", () => {
	it("measures the OSM line when no official length is given", () => {
		const { summary, osmKm } = buildTrail(trail, [line]);
		expect(osmKm).toBeCloseTo(78.7, 0);
		expect(summary.lengthKm).toBe(79);
		expect(summary.lengthSource).toBe("osm");
		expect(summary.days).toEqual({ min: 3, max: 4 });
		expect(summary.daysSource).toBe("estimate");
	});

	it("prefers the official length and days", () => {
		const { summary } = buildTrail(
			{ ...trail, lengthKm: 80, days: { min: 4, max: 5 } },
			[line],
		);
		expect(summary.lengthKm).toBe(80);
		expect(summary.lengthSource).toBe("official");
		expect(summary.days).toEqual({ min: 4, max: 5 });
		expect(summary.daysSource).toBe("official");
	});

	it("simplifies a straight line down to its ends", () => {
		const { atlas, detail } = buildTrail(trail, [line]);
		expect(atlas.geometry.coordinates).toEqual([
			[
				[10, 45],
				[11, 45],
			],
		]);
		expect(detail.geometry.coordinates[0]).toHaveLength(2);
	});

	it("reports the bounding box west, south, east, north", () => {
		const { summary } = buildTrail(trail, [line]);
		expect(summary.bbox).toEqual([10, 45, 11, 45]);
	});
});
