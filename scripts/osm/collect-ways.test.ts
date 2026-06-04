import { describe, expect, it } from "vitest";
import { collectWays } from "./collect-ways.ts";
import type { OverpassRelation } from "./overpass.ts";

const way = (ref: number, role = "") => ({
	type: "way" as const,
	ref,
	role,
	geometry: [
		{ lat: 0, lon: ref },
		{ lat: 0, lon: ref + 1 },
	],
});

const rel = (
	id: number,
	members: OverpassRelation["members"],
): OverpassRelation => ({ type: "relation", id, members });

describe("collectWays", () => {
	it("walks down through stage relations", () => {
		const relations = [
			rel(1, [
				{ type: "relation", ref: 2, role: "" },
				{ type: "relation", ref: 3, role: "" },
			]),
			rel(2, [way(10), way(11)]),
			rel(3, [way(12)]),
		];
		const { ways } = collectWays(1, relations);
		expect(ways.map((w) => w.id)).toEqual([10, 11, 12]);
		expect(ways[0]?.coords).toEqual([
			[10, 0],
			[11, 0],
		]);
	});

	it("leaves out variants and side trips", () => {
		const relations = [
			rel(1, [
				way(10),
				way(11, "alternative"),
				way(12, "excursion"),
				{ type: "relation", ref: 2, role: "alternative" },
			]),
			rel(2, [way(20)]),
		];
		expect(collectWays(1, relations).ways.map((w) => w.id)).toEqual([10]);
	});

	it("counts a way shared by two stages once", () => {
		const relations = [
			rel(1, [
				{ type: "relation", ref: 2, role: "" },
				{ type: "relation", ref: 3, role: "" },
			]),
			rel(2, [way(10), way(11)]),
			rel(3, [way(11), way(12)]),
		];
		expect(collectWays(1, relations).ways.map((w) => w.id)).toEqual([
			10, 11, 12,
		]);
	});

	it("survives a relation that contains itself", () => {
		const relations = [
			rel(1, [{ type: "relation", ref: 1, role: "" }, way(10)]),
		];
		expect(collectWays(1, relations).ways).toHaveLength(1);
	});

	it("reports child relations missing from the response", () => {
		const relations = [rel(1, [{ type: "relation", ref: 99, role: "" }])];
		expect(collectWays(1, relations).missingRelations).toEqual([99]);
	});

	it("drops nodes Overpass could not resolve", () => {
		const relations = [
			rel(1, [
				{
					type: "way",
					ref: 10,
					role: "",
					geometry: [{ lat: 0, lon: 0 }, null, { lat: 0, lon: 2 }],
				},
			]),
		];
		expect(collectWays(1, relations).ways[0]?.coords).toEqual([
			[0, 0],
			[2, 0],
		]);
	});
});
