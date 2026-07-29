import { describe, expect, it } from "vitest";
import { lineDistanceKm } from "./line-distance.ts";

describe("lineDistanceKm", () => {
	it("is zero where two trails cross in an X with no vertex at the crossing", () => {
		const a = [
			[
				[10, 45],
				[10.2, 45.2],
			],
		];
		const b = [
			[
				[10, 45.2],
				[10.2, 45],
			],
		];
		expect(lineDistanceKm(a, b, 50)).toBeCloseTo(0, 1);
	});

	it("measures parallel trails about 11 km apart", () => {
		const a = [
			[
				[10, 45],
				[11, 45],
			],
		];
		const b = [
			[
				[10, 45.1],
				[11, 45.1],
			],
		];
		expect(lineDistanceKm(a, b, 50)).toBeCloseTo(11.06, 0);
	});

	it("still finds a neighbour east or west near Nordkapp", () => {
		const a = [
			[
				[25, 71],
				[25, 71.1],
			],
		];
		const b = [
			[
				[26.2, 71],
				[26.2, 71.1],
			],
		];
		expect(lineDistanceKm(a, b, 50)).toBeCloseTo(43.5, 0);
	});

	it("gives up beyond the limit", () => {
		const a = [
			[
				[10, 45],
				[10.1, 45],
			],
		];
		const b = [
			[
				[12, 45],
				[12.1, 45],
			],
		];
		expect(lineDistanceKm(a, b, 50)).toBeNull();
	});

	it("looks at every piece of a trail drawn in several lines", () => {
		const a = [
			[
				[0, 0],
				[0.1, 0],
			],
			[
				[5, 5],
				[5.1, 5],
			],
		];
		const b = [
			[
				[5.05, 5.005],
				[5.05, 5.1],
			],
		];
		expect(lineDistanceKm(a, b, 50)).toBeLessThan(1);
	});
});
