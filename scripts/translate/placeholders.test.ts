import { describe, expect, it } from "vitest";
import {
	pluralSample,
	protect,
	restore,
	withoutSample,
	withSample,
} from "./placeholders.ts";

describe("protect and restore", () => {
	it("round-trips every placeholder", () => {
		const text = "How long is the {{title}}? {{km}} in {{count}} days.";
		expect(protect(text)).toBe(
			"How long is the <ph>title</ph>? <ph>km</ph> in <ph>count</ph> days.",
		);
		expect(restore(protect(text))).toBe(text);
	});
});

describe("plural samples", () => {
	it("picks numbers Russian sorts into each form", () => {
		expect(pluralSample("ru", "one")).toBe(21);
		expect(pluralSample("ru", "few")).toBe(22);
		expect(pluralSample("ru", "many")).toBe(25);
	});

	it("has no whole number for a form only fractions take", () => {
		expect(pluralSample("ru", "other")).toBeNull();
	});

	it("falls back to small numbers where only they fit", () => {
		expect(pluralSample("en", "one")).toBe(1);
		expect(pluralSample("ar", "two")).toBe(2);
	});

	it("puts the placeholder back where the number landed", () => {
		expect(withSample("{{min}}–{{count}} days", 22)).toBe("{{min}}–22 days");
		expect(withoutSample("{{min}}–22 дня", 22)).toBe("{{min}}–{{count}} дня");
	});

	it("does not mistake part of a longer number for the sample", () => {
		expect(withoutSample("122 дня, 22 дня", 22)).toBe("122 дня, {{count}} дня");
	});

	it("reports a number the translator spelled out", () => {
		expect(withoutSample("ein Tag", 1)).toBeNull();
	});
});
