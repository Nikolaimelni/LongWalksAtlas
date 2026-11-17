import { describe, expect, it } from "vitest";
import { gapLines } from "./gap-lines.ts";

describe("gapLines", () => {
	it("bridges two pieces from an end to the nearest point", () => {
		expect(
			gapLines(
				[
					[
						[0, 0],
						[0.1, 0],
					],
					[
						[0.2, 0],
						[0.3, 0],
					],
				],
				50,
			),
		).toEqual([
			[
				[0.1, 0],
				[0.2, 0],
			],
		]);
	});

	it("leaves a hole wider than the limit", () => {
		expect(
			gapLines(
				[
					[
						[0, 0],
						[0.1, 0],
					],
					[
						[0.2, 0],
						[0.3, 0],
					],
				],
				5,
			),
		).toEqual([]);
	});

	it("draws nothing where a piece starts on another", () => {
		expect(
			gapLines(
				[
					[
						[0, 0],
						[1, 0],
					],
					[
						[0.5, 0],
						[0.5, 0.5],
					],
				],
				50,
			),
		).toEqual([]);
	});

	it("reaches the middle of a segment, not only its vertices", () => {
		expect(
			gapLines(
				[
					[
						[0, 0],
						[1, 0],
					],
					[
						[0.5, 0.05],
						[0.5, 0.5],
					],
				],
				50,
			),
		).toEqual([
			[
				[0.5, 0.05],
				[0.5, 0],
			],
		]);
	});

	it("links three pieces in a row with two dashes, not three", () => {
		const gaps = gapLines(
			[
				[
					[0, 0],
					[0.1, 0],
				],
				[
					[0.15, 0],
					[0.25, 0],
				],
				[
					[0.3, 0],
					[0.4, 0],
				],
			],
			50,
		);
		expect(gaps).toEqual([
			[
				[0.1, 0],
				[0.15, 0],
			],
			[
				[0.25, 0],
				[0.3, 0],
			],
		]);
	});
});
