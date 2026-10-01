import { describe, expect, it } from "vitest";
import type { TrailSummary } from "../trails/trail-schema";
import { countryHub, hubPath, listHubs, typeHub } from "./hubs";

const trails: Pick<TrailSummary, "type" | "countries">[] = [
	{ type: "coastal", countries: ["TR"] },
	{ type: "historic", countries: ["TR"] },
	{ type: "mountain", countries: ["FR", "IT", "CH"] },
	{ type: "e-path", countries: ["NO", "DE", "CH", "IT"] },
	{ type: "pilgrimage", countries: ["PT", "ES"] },
	{ type: "pilgrimage", countries: ["ES"] },
];

describe("listHubs", () => {
	it("makes a page for every country and type with two trails or more", () => {
		expect(listHubs(trails)).toEqual([
			{ kind: "country", code: "CH" },
			{ kind: "country", code: "ES" },
			{ kind: "country", code: "IT" },
			{ kind: "country", code: "TR" },
			{ kind: "type", type: "pilgrimage" },
		]);
	});

	it("has nothing to offer while every trail is alone", () => {
		expect(listHubs(trails.slice(0, 1))).toEqual([]);
	});
});

describe("hubPath", () => {
	it("uses the lowercase country code", () => {
		expect(hubPath({ kind: "country", code: "TR" })).toBe("country/tr/");
		expect(hubPath({ kind: "type", type: "e-path" })).toBe("type/e-path/");
	});
});

describe("countryHub and typeHub", () => {
	it("read a hub from its URL segment", () => {
		expect(countryHub("tr", trails)).toEqual({ kind: "country", code: "TR" });
		expect(typeHub("pilgrimage", trails)).toEqual({
			kind: "type",
			type: "pilgrimage",
		});
	});

	it("refuse uppercase codes, unknown types and hubs too small to exist", () => {
		expect(countryHub("TR", trails)).toBeNull();
		expect(countryHub("pt", trails)).toBeNull();
		expect(countryHub(undefined, trails)).toBeNull();
		expect(typeHub("desert", trails)).toBeNull();
		expect(typeHub("coastal", trails)).toBeNull();
	});
});
