import { describe, expect, it } from "vitest";
import { isUsableLicense, plainText } from "./build-photos.ts";

describe("plainText", () => {
	it("keeps the name out of a Commons user-page link", () => {
		expect(
			plainText(
				'<a href="//commons.wikimedia.org/wiki/User:Tiia_Monto" title="User:Tiia Monto">Tiia Monto</a>',
			),
		).toBe("Tiia Monto");
	});

	it("decodes the entities Commons uses and squeezes whitespace", () => {
		expect(plainText("Guilhem Vellut&nbsp;from\n Annecy &amp; Chamonix")).toBe(
			"Guilhem Vellut from Annecy & Chamonix",
		);
	});
});

describe("isUsableLicense", () => {
	it("accepts the free licences Commons normally carries", () => {
		for (const license of [
			"CC BY-SA 4.0",
			"CC BY 2.0",
			"CC0",
			"Public domain",
		]) {
			expect(isUsableLicense(license)).toBe(true);
		}
	});

	it("refuses non-commercial, no-derivatives and missing licences", () => {
		for (const license of ["CC BY-NC-SA 4.0", "CC BY-ND 2.0", ""]) {
			expect(isUsableLicense(license)).toBe(false);
		}
	});
});
