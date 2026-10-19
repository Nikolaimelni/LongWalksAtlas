import { describe, expect, it } from "vitest";
import { basemapColors } from "~/features/map/basemap-colors";
import { type Scheme, trailPalettes } from "./trail-style";

function luminance(hex: string): number {
	const [r = 0, g = 0, b = 0] = (hex.slice(1).match(/\w\w/g) ?? []).map((h) => {
		const v = Number.parseInt(h, 16) / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

describe("trail colours", () => {
	for (const scheme of ["light", "dark"] as Scheme[]) {
		// Only the land: each line sits on a land-coloured casing, over water and woods too.
		const { land } = basemapColors[scheme];
		for (const [type, colour] of Object.entries(trailPalettes[scheme])) {
			it(`${scheme} ${type} stands out from the land by 3:1`, () => {
				expect(contrast(colour, land)).toBeGreaterThanOrEqual(3);
			});
		}
	}

	it("measures black on white at 21:1", () => {
		expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
	});
});
