import { describe, expect, it } from "vitest";
import { getI18n } from "../i18n/i18n";
import type { Lang } from "../i18n/languages";
import { loadMessages } from "../i18n/messages";
import type { TrailSummary } from "../trails/trail-schema";
import { hubIntro, hubTitle } from "./hub-meta";

const base: TrailSummary = {
	slug: "x",
	name: { original: "X" },
	type: "pilgrimage",
	region: "europe",
	start: { name: "A", coords: [0, 40] },
	end: { name: "B", coords: [1, 41] },
	countries: ["ES"],
	bestSeason: [],
	badges: [],
	lengthKm: 100,
	lengthSource: "official",
	daysSource: "official",
	days: { min: 5, max: 5 },
	bbox: [0, 40, 1, 41],
	crosses: [],
	nearby: [],
};

async function tIn(lang: Lang) {
	return getI18n(lang, await loadMessages(lang)).getFixedT(lang);
}

describe("hubIntro", () => {
	const caminos = [
		{ ...base, lengthKm: 620, countries: ["PT", "ES"] },
		{ ...base, lengthKm: 240, countries: ["ES"] },
	];

	it("gives the count, the countries and the shortest and longest trail", async () => {
		expect(
			hubIntro(
				await tIn("en"),
				"en",
				{ kind: "type", type: "pilgrimage" },
				caminos,
			),
		).toBe(
			"The atlas has 2 trails of this kind, across Portugal and Spain, from 240 km to 620 km.",
		);
	});

	it("uses the Russian plural forms", async () => {
		const t = await tIn("ru");
		const spain = { kind: "country", code: "ES" } as const;
		expect(hubIntro(t, "ru", spain, caminos)).toBe(
			"На атласе 2 маршрута по этой стране, от 240 км до 620 км.",
		);
		expect(hubIntro(t, "ru", spain, Array(5).fill(base))).toBe(
			"На атласе 5 маршрутов по этой стране, от 100 км до 100 км.",
		);
	});
});

describe("hubTitle", () => {
	it("names the country in the page's language", async () => {
		expect(
			hubTitle(await tIn("ru"), "ru", { kind: "country", code: "ES" }),
		).toBe("Испания: многодневные пешие маршруты");
		expect(
			hubTitle(await tIn("en"), "en", { kind: "type", type: "forest" }),
		).toBe("Forest trails on the map");
	});
});
