import { describe, expect, it } from "vitest";
import { mergeLines } from "./merge-lines.ts";

describe("mergeLines", () => {
	it("joins ways that meet end to start", () => {
		expect(
			mergeLines([
				[
					[0, 0],
					[1, 0],
				],
				[
					[1, 0],
					[2, 0],
				],
			]),
		).toEqual([
			[
				[0, 0],
				[1, 0],
				[2, 0],
			],
		]);
	});

	it("flips a way drawn in the other direction", () => {
		expect(
			mergeLines([
				[
					[0, 0],
					[1, 0],
				],
				[
					[2, 0],
					[1, 0],
				],
			]),
		).toEqual([
			[
				[0, 0],
				[1, 0],
				[2, 0],
			],
		]);
	});

	it("grows in both directions from a way in the middle", () => {
		expect(
			mergeLines([
				[
					[1, 0],
					[2, 0],
				],
				[
					[2, 0],
					[3, 0],
				],
				[
					[0, 0],
					[1, 0],
				],
			]),
		).toEqual([
			[
				[0, 0],
				[1, 0],
				[2, 0],
				[3, 0],
			],
		]);
	});

	it("keeps disconnected pieces apart", () => {
		expect(
			mergeLines([
				[
					[0, 0],
					[1, 0],
				],
				[
					[5, 5],
					[6, 5],
				],
			]),
		).toHaveLength(2);
	});

	it("splits at a junction without losing a way", () => {
		const merged = mergeLines([
			[
				[0, 0],
				[1, 0],
			],
			[
				[1, 0],
				[2, 0],
			],
			[
				[1, 0],
				[1, 1],
			],
		]);
		expect(merged).toHaveLength(2);
		expect(merged.flat()).toHaveLength(5);
	});

	it("closes a loop into one ring", () => {
		const merged = mergeLines([
			[
				[0, 0],
				[1, 0],
			],
			[
				[1, 0],
				[1, 1],
			],
			[
				[1, 1],
				[0, 0],
			],
		]);
		expect(merged).toEqual([
			[
				[0, 0],
				[1, 0],
				[1, 1],
				[0, 0],
			],
		]);
	});

	it("ignores degenerate ways", () => {
		expect(mergeLines([[[0, 0]], []])).toEqual([]);
	});
});
