import { describe, expect, it } from "vitest";
import { planUi, type Translator, translateUi } from "./ui.ts";

const en = {
	app: { name: "Long Walks Atlas", close: "Close" },
	trail: {
		days_one: "{{count}} day",
		days_other: "{{count}} days",
		lengthQ: "How long is the {{title}}?",
	},
};

const fake: Translator = async (texts) => texts.map((t) => `[ru] ${t}`);

describe("planUi", () => {
	it("asks only for what the language lacks", () => {
		const jobs = planUi(en, { app: { name: "Атлас троп" } }, "ru");
		expect(jobs.map((j) => [...j.path, j.key].join("."))).toEqual([
			"app.close",
			"trail.days_one",
			"trail.days_few",
			"trail.days_many",
			"trail.lengthQ",
		]);
	});

	it("sends a real number for each plural form and guards the other placeholders", () => {
		const jobs = planUi(en, {}, "ru");
		expect(jobs.find((j) => j.key === "days_few")?.text).toBe("22 days");
		expect(jobs.find((j) => j.key === "lengthQ")?.text).toBe(
			"How long is the <ph>title</ph>?",
		);
	});

	it("needs a single form for a language without plurals", () => {
		const keys = planUi(en, {}, "ja").map((j) => j.key);
		expect(keys.filter((k) => k.startsWith("days"))).toEqual(["days_other"]);
	});
});

describe("translateUi", () => {
	it("keeps existing strings, fills the gaps and restores placeholders", async () => {
		const { tree, borrowed } = await translateUi(
			en,
			{ app: { name: "Атлас троп" }, stale: "gone" },
			"ru",
			fake,
		);
		expect(tree).toEqual({
			app: { name: "Атлас троп", close: "[ru] Close" },
			trail: {
				days_one: "[ru] {{count}} day",
				days_few: "[ru] {{count}} days",
				days_many: "[ru] {{count}} days",
				days_other: "[ru] {{count}} days",
				lengthQ: "[ru] How long is the {{title}}?",
			},
		});
		expect(borrowed).toEqual([]);
	});

	it("gives Russian 'other' the wording of 'few'", async () => {
		const russian: Translator = async (texts) =>
			texts.map((t) =>
				t
					.replace("21 day", "21 день")
					.replace("22 days", "22 дня")
					.replace("25 days", "25 дней"),
			);
		const { tree } = await translateUi(en, {}, "ru", russian);
		expect(tree.trail).toMatchObject({
			days_one: "{{count}} день",
			days_few: "{{count}} дня",
			days_many: "{{count}} дней",
			days_other: "{{count}} дня",
		});
	});

	it("borrows another form when a number comes back as a word", async () => {
		const spellsOut: Translator = async (texts) =>
			texts.map((t) => (t === "21 day" ? "один день" : t));
		const { tree, borrowed } = await translateUi(en, {}, "ru", spellsOut);
		expect(borrowed).toEqual(["trail.days_one"]);
		expect((tree.trail as Record<string, string>).days_one).toBe(
			"{{count}} days",
		);
	});
});
