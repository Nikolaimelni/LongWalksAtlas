import { describe, expect, it } from "vitest";
import type { TrailSummary } from "~/features/trails/trail-schema";
import {
	applyFilters,
	countActive,
	type Filters,
	parseFilters,
	writeFilters,
} from "./filters";

const params = (query: string) => new URLSearchParams(query);

function trail(
	slug: string,
	overrides: Partial<TrailSummary> = {},
): TrailSummary {
	return {
		slug,
		name: { original: slug },
		type: "coastal",
		region: "europe",
		start: { name: "A", coords: [0, 0] },
		end: { name: "B", coords: [1, 1] },
		countries: ["TR"],
		bestSeason: [],
		badges: [],
		lengthKm: 300,
		lengthSource: "official",
		daysSource: "official",
		days: { min: 12, max: 15 },
		bbox: [0, 0, 1, 1],
		crosses: [],
		nearby: [],
		...overrides,
	};
}

const none: Omit<Filters, "q"> = {
	types: [],
	regions: [],
	country: null,
	length: null,
	days: null,
};

describe("parseFilters", () => {
	it("reads a full set of filters", () => {
		expect(
			parseFilters(
				params(
					"q=lyc&type=coastal,mountain&region=europe,africa&country=TR&length=long&days=month",
				),
			),
		).toEqual({
			q: "lyc",
			types: ["coastal", "mountain"],
			regions: ["europe", "africa"],
			country: "TR",
			length: "long",
			days: "month",
		});
	});

	it("drops what it does not understand instead of failing", () => {
		expect(
			parseFilters(
				params("type=coastal,volcano&region=mars&country=turkey&length=huge"),
			),
		).toEqual({
			q: "",
			types: ["coastal"],
			regions: [],
			country: null,
			length: null,
			days: null,
		});
	});

	it("reads an empty query string as no filters", () => {
		expect(parseFilters(params(""))).toEqual({ q: "", ...none });
	});
});

describe("writeFilters", () => {
	it("keeps unrelated parameters and drops empty filters", () => {
		const next = writeFilters(params("trail=e1&type=coastal&q=x"), {
			q: "  ",
			...none,
			types: ["mountain", "e-path"],
		});
		expect(next.toString()).toBe("trail=e1&type=mountain%2Ce-path");
	});

	it("round-trips through parseFilters", () => {
		const filters = {
			q: "via",
			types: ["pilgrimage" as const],
			regions: ["europe" as const],
			country: "IT",
			length: "epic" as const,
			days: "more" as const,
		};
		expect(parseFilters(writeFilters(params(""), filters))).toEqual(filters);
	});
});

describe("applyFilters", () => {
	const trails = [
		trail("short-coast", { lengthKm: 120, days: { min: 5, max: 7 } }),
		trail("alps", {
			type: "mountain",
			countries: ["FR", "IT", "CH"],
			lengthKm: 170,
			days: { min: 7, max: 10 },
		}),
		trail("e1", {
			type: "e-path",
			countries: ["NO", "DE", "IT"],
			lengthKm: 7114,
			days: { min: 285, max: 356 },
		}),
	];
	const slugs = (filters: typeof none) =>
		applyFilters(trails, filters).map((t) => t.slug);

	it("returns everything without filters", () => {
		expect(slugs(none)).toEqual(["short-coast", "alps", "e1"]);
	});

	it("matches any of the chosen types", () => {
		expect(slugs({ ...none, types: ["mountain", "e-path"] })).toEqual([
			"alps",
			"e1",
		]);
	});

	it("matches any of the chosen regions", () => {
		const world = [
			...trails,
			trail("kepler", { region: "oceania" }),
			trail("otter", { region: "africa" }),
		];
		const pick = (regions: (typeof none)["regions"]) =>
			applyFilters(world, { ...none, regions }).map((t) => t.slug);
		expect(pick(["oceania"])).toEqual(["kepler"]);
		expect(pick(["oceania", "africa"])).toEqual(["kepler", "otter"]);
	});

	it("matches a country anywhere on the route", () => {
		expect(slugs({ ...none, country: "IT" })).toEqual(["alps", "e1"]);
	});

	it("puts a 7 to 10 day trail in both the week and fortnight buckets", () => {
		expect(slugs({ ...none, days: "week" })).toEqual(["short-coast", "alps"]);
		expect(slugs({ ...none, days: "fortnight" })).toEqual(["alps"]);
	});

	it("treats a bucket's upper edge as open-ended for the last one", () => {
		expect(slugs({ ...none, length: "epic" })).toEqual(["e1"]);
	});

	it("puts a trail on a shared edge in the upper length bucket only", () => {
		const edges = [
			trail("at-500", { lengthKm: 500 }),
			trail("at-1000", { lengthKm: 1000 }),
		];
		const bucket = (length: (typeof none)["length"]) =>
			applyFilters(edges, { ...none, length }).map((t) => t.slug);
		expect(bucket("medium")).toEqual([]);
		expect(bucket("long")).toEqual(["at-500"]);
		expect(bucket("epic")).toEqual(["at-1000"]);
	});

	it("combines filters with AND", () => {
		expect(slugs({ ...none, country: "IT", length: "short" })).toEqual([
			"alps",
		]);
	});
});

describe("countActive", () => {
	it("counts each chosen type and each set filter, but not the search", () => {
		expect(
			countActive({
				q: "x",
				types: ["coastal", "mountain"],
				regions: ["europe"],
				country: "TR",
				length: null,
				days: "week",
			}),
		).toBe(5);
	});
});
