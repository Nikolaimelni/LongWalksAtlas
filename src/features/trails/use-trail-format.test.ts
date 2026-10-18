import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { monthRuns, trailFormat } from "./use-trail-format";

// why: months() never calls t, and a whole i18next instance would only hide that.
const t = (() => "") as unknown as TFunction;

describe("monthRuns", () => {
	it("joins consecutive months and keeps gaps apart", () => {
		expect(monthRuns([2, 3, 4, 9, 10])).toEqual([
			[2, 4],
			[9, 10],
		]);
	});

	it("carries a season over the new year as one run", () => {
		expect(monthRuns([0, 1, 10, 11])).toEqual([[10, 1]]);
	});

	it("leaves a lone month on its own", () => {
		expect(monthRuns([6])).toEqual([[6, 6]]);
	});
});

describe("months", () => {
	it("reads runs of months as ranges", () => {
		expect(
			trailFormat(t, "en").months(["mar", "apr", "may", "oct", "nov"]),
		).toBe("March–May and October–November");
	});
});
