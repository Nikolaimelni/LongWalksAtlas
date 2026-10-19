import { describe, expect, it } from "vitest";
import { isLang, ogLocale, pickLang, swapLang } from "./languages";

describe("pickLang", () => {
	it("takes an exact match", () => {
		expect(pickLang(["ru"])).toBe("ru");
	});

	it("matches a regional variant to the language we ship", () => {
		expect(pickLang(["ru-RU"])).toBe("ru");
		expect(pickLang(["pt-BR"])).toBe("pt-PT");
		expect(pickLang(["ko-KR"])).toBe("ko");
	});

	it("skips a language the atlas does not have", () => {
		expect(pickLang(["zh-TW", "ja"])).toBe("ja");
		expect(pickLang(["zh-Hant"])).toBe("en");
	});

	it("walks the list in order", () => {
		expect(pickLang(["hu-HU", "de-AT", "fr"])).toBe("de");
	});

	it("skips malformed tags", () => {
		expect(pickLang(["not a tag", "tr-TR"])).toBe("tr");
	});

	it("only picks from the languages on offer", () => {
		const offered = [{ code: "en" as const }, { code: "ru" as const }];
		expect(pickLang(["de-DE", "ru"], offered)).toBe("ru");
		expect(pickLang(["de-DE"], offered)).toBe("en");
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
		expect(swapLang("/en", "cs")).toBe("/cs");
		expect(swapLang("/en/", "ja")).toBe("/ja/");
	});
});

describe("ogLocale", () => {
	it("adds the likely territory", () => {
		expect(ogLocale("en")).toBe("en_US");
		expect(ogLocale("ru")).toBe("ru_RU");
		expect(ogLocale("pt-PT")).toBe("pt_PT");
		expect(ogLocale("cs")).toBe("cs_CZ");
		expect(ogLocale("uk")).toBe("uk_UA");
	});
});
