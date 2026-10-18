import { describe, expect, it } from "vitest";
import { estimateDays } from "./day-estimate";

describe("estimateDays", () => {
	it("assumes 20 to 25 km a day", () => {
		expect(estimateDays(500)).toEqual({ min: 20, max: 25 });
	});

	it("never says zero days", () => {
		expect(estimateDays(8)).toEqual({ min: 1, max: 1 });
	});
});
