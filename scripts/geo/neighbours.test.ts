import { describe, expect, it } from "vitest";
import { findNeighbours } from "./neighbours.ts";

const trail = (slug: string, x: number, y: number) => ({
	slug,
	bbox: [x, y, x + 0.2, y] as [number, number, number, number],
	lines: [
		[
			[x, y],
			[x + 0.2, y],
		],
	],
});

describe("findNeighbours", () => {
	const result = findNeighbours([
		trail("a", 10, 45),
		trail("crossing", 10.1, 45),
		trail("near", 10, 45.2),
		trail("far", 20, 45),
	]);

	it("splits neighbours into crossing and nearby, both ways round", () => {
		expect(result.get("a")).toEqual({
			crosses: ["crossing"],
			nearby: ["near"],
		});
		expect(result.get("near")?.nearby).toEqual(["a", "crossing"]);
	});

	it("leaves a trail with nobody around on its own", () => {
		expect(result.get("far")).toEqual({ crosses: [], nearby: [] });
	});
});
