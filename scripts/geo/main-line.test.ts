import type { Position } from "geojson";
import { describe, expect, it } from "vitest";
import { haversineKm, mainLine } from "./main-line.ts";

const p = (x: number, y = 0): Position => [x / 100, y / 100];

describe("mainLine", () => {
	it("follows the trunk and drops a branch that starts elsewhere", () => {
		const trunk = [p(0), p(1), p(2), p(3)];
		const branch = [p(1, 5), p(1, 3), p(1, 1), p(1)];
		expect(mainLine([trunk, branch], p(0), p(3))).toEqual(trunk);
	});

	it("takes the shorter of two unmarked variants", () => {
		const direct = [p(0), p(1), p(2)];
		const detour = [p(0), p(0, 3), p(2, 3), p(2)];
		expect(mainLine([detour, direct], p(0), p(2))).toEqual(direct);
	});

	it("joins ways regardless of the direction they were drawn in", () => {
		expect(
			mainLine(
				[
					[p(1), p(0)],
					[p(2), p(1)],
				],
				p(0),
				p(2),
			),
		).toEqual([p(0), p(1), p(2)]);
	});

	it("turns at a junction in the middle of a way", () => {
		const road = [p(0), p(1), p(2)];
		const side = [p(1), p(1, 1), p(1, 2)];
		expect(mainLine([road, side], p(0), p(1, 2))).toEqual([
			p(0),
			p(1),
			p(1, 1),
			p(1, 2),
		]);
	});

	it("hops over a small gap in the mapping", () => {
		const first = [p(0), p(1)];
		const second = [p(1.3), p(2)];
		expect(mainLine([first, second], p(0), p(2))).toEqual([
			p(0),
			p(1),
			p(1.3),
			p(2),
		]);
	});

	it("hops over the same small gap in Lapland, where longitude is narrow", () => {
		// 0.01° of longitude at 67° N is about 430 m: inside the 500 m bridge.
		const first: Position[] = [
			[15, 67],
			[15.04, 67],
		];
		const second: Position[] = [
			[15.05, 67],
			[15.09, 67],
		];
		expect(mainLine([first, second], [15, 67], [15.09, 67])).toEqual([
			...first,
			...second,
		]);
	});

	it("gives up on a gap too wide to be a mapping slip", () => {
		expect(
			mainLine(
				[
					[p(0), p(1)],
					[p(3), p(4)],
				],
				p(0),
				p(4),
			),
		).toBeNull();
	});

	it("snaps an official start that sits off the line", () => {
		expect(mainLine([[p(0), p(1)]], p(0, 1), p(1))).toEqual([p(0), p(1)]);
	});

	it("gives up when the official start is nowhere near the line", () => {
		expect(mainLine([[p(0), p(1)]], p(0, 50), p(1))).toBeNull();
	});
});

describe("haversineKm", () => {
	it("measures Lisbon to Santiago as the crow flies", () => {
		expect(haversineKm([-9.1335, 38.7098], [-8.5446, 42.8806])).toBeCloseTo(
			466,
			-1,
		);
	});
});
