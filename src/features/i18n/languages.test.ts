import { describe, expect, it } from "vitest";
import { isLang, pickLang, swapLang } from "./languages";

describe("pickLang", () => {
	it("takes an exact match", () => {
		expect(pickLang(["ru"])).toBe("ru");
	});

	it("matches a regional variant to the language we ship", () => {
		expect(pickLang(["ru-RU"])).toBe("ru");
		expect(pickLang(["pt-BR"])).toBe("pt-PT");
		expect(pickLang(["zh-CN"])).toBe("zh-Hans");
	});

	it("does not serve Simplified Chinese to a Traditional reader", () => {
		expect(pickLang(["zh-TW", "ja"])).toBe("ja");
		expect(pickLang(["zh-Hant"])).toBe("en");
	});

	it("walks the list in order", () => {
		expect(pickLang(["nl-NL", "de-AT", "fr"])).toBe("de");
	});

	it("skips malformed tags", () => {
		expect(pickLang(["not a tag", "tr-TR"])).toBe("tr");
	});

	it("falls back to English", () => {
		expect(pickLang([])).toBe("en");
		expect(pickLang(["sr-Latn-RS"])).toBe("en");
	});
});

describe("isLang", () => {
	it("is case-sensitive, like the URLs", () => {
		expect(isLang("pt-PT")).toBe(true);
		expect(isLang("pt-pt")).toBe(false);
		expect(isLang(undefined)).toBe(false);
	});
});

describe("swapLang", () => {
	it("replaces only the first segment", () => {
		expect(swapLang("/en/trail/camino-portugues", "ru")).toBe(
			"/ru/trail/camino-portugues",
		);
		expect(swapLang("/en", "ar")).toBe("/ar");
		expect(swapLang("/en/", "ja")).toBe("/ja/");
	});
});
