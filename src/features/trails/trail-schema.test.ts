import { describe, expect, it } from "vitest";
import { trailFileSchema } from "./trail-schema";

const valid = {
	slug: "tour-du-mont-blanc",
	name: { original: "Tour du Mont Blanc" },
	type: "mountain",
	region: "europe",
	start: { name: "Les Houches", coords: [6.7957, 45.8907] },
	end: { name: "Les Houches", coords: [6.7957, 45.8907] },
	countries: ["FR", "IT", "CH"],
	lengthKm: 170,
	days: { min: 10, max: 11 },
	bestSeason: ["jun", "jul", "aug", "sep"],
	badges: [],
	officialUrl: "https://www.autourdumontblanc.com/",
	sources: ["https://www.autourdumontblanc.com/"],
	photo: null,
	wikidata: null,
	geometry: { source: "osm", relationIds: [124456] },
};

function issuesFor(input: unknown) {
	const result = trailFileSchema.safeParse(input);
	return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
}

describe("trailFileSchema", () => {
	it("accepts a complete trail", () => {
		expect(issuesFor(valid)).toEqual([]);
	});

	it("allows the numbers to be unknown yet", () => {
		expect(issuesFor({ ...valid, lengthKm: null, days: null })).toEqual([]);
	});

	it("rejects an unknown key instead of dropping it", () => {
		expect(issuesFor({ ...valid, lenghtKm: 170 })).toEqual([""]);
	});

	it("rejects a day range that runs backwards", () => {
		expect(issuesFor({ ...valid, days: { min: 12, max: 10 } })).toEqual([
			"days",
		]);
	});

	it("rejects coordinates given as lat, lng", () => {
		const swapped = { name: "Nordkapp", coords: [71.17, 25.78] };
		expect(issuesFor({ ...valid, start: swapped })).toEqual(["start.coords"]);
	});

	it("checks coordinates against the trail's own region", () => {
		const bluff = { name: "Bluff", coords: [168.3627, -46.6141] };
		const kiwi = { ...valid, start: bluff, end: bluff, countries: ["NZ"] };
		expect(issuesFor({ ...kiwi, region: "oceania" })).toEqual([]);
		expect(issuesFor({ ...kiwi, region: "europe" })).toEqual([
			"start.coords",
			"end.coords",
		]);
	});

	it("wants slugs in kebab case", () => {
		expect(issuesFor({ ...valid, slug: "Tour_du_Mont_Blanc" })).toEqual([
			"slug",
		]);
	});

	it("wants ISO country codes in upper case", () => {
		expect(issuesFor({ ...valid, countries: ["fr"] })).toEqual(["countries.0"]);
	});

	it("takes only web addresses as sources", () => {
		expect(
			issuesFor({
				...valid,
				sources: ["http://example.com/", "javascript:alert(1)", "data:,x"],
			}),
		).toEqual(["sources.1", "sources.2"]);
	});

	it("needs at least one OSM relation", () => {
		expect(
			issuesFor({ ...valid, geometry: { source: "osm", relationIds: [] } }),
		).toEqual(["geometry.relationIds"]);
	});
});
