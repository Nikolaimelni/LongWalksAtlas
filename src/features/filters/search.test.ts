import { describe, expect, it } from "vitest";
import { createSearch } from "./search";

const search = createSearch([
	{
		slug: "caminho-portugues",
		title: "Portuguese Way",
		original: "Caminho Português",
		places: ["Lisboa", "Santiago de Compostela"],
		countries: ["Portugal", "Spain"],
	},
	{
		slug: "lycian-way",
		title: "Ликийская тропа",
		original: "Likya Yolu",
		places: ["Ölüdeniz", "Geyikbayırı"],
		countries: ["Турция"],
	},
	{
		slug: "tour-du-mont-blanc",
		title: "Tour du Mont Blanc",
		original: "Tour du Mont Blanc",
		places: ["Les Houches"],
		countries: ["France", "Italy", "Switzerland"],
	},
]);

const found = (q: string) => search(q) ?? [];

describe("createSearch", () => {
	it("finds a trail by its translated or original name", () => {
		expect(found("ликийская")).toEqual(["lycian-way"]);
		expect(found("likya")).toEqual(["lycian-way"]);
	});

	it("forgives a typo", () => {
		expect(found("caminho portuges")).toEqual(["caminho-portugues"]);
	});

	it("ignores accents", () => {
		expect(found("oludeniz")).toEqual(["lycian-way"]);
		expect(found("portugues")).toContain("caminho-portugues");
	});

	it("finds a trail by a place on it", () => {
		expect(found("santiago")).toEqual(["caminho-portugues"]);
	});

	it("means no search when the box is empty", () => {
		expect(search("   ")).toBeNull();
	});
});
