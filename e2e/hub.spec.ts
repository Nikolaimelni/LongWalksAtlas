import { expect, test } from "@playwright/test";
import { countOf, trails } from "./trail-data";

test("a country page lists its trails and is linked from them", async ({
	page,
}) => {
	await page.goto("/ru/trail/lycian-way/");
	await page.getByRole("link", { name: "Турция", exact: true }).click();
	await expect(page).toHaveURL(/\/ru\/country\/tr\/$/);
	await expect(
		page.getByRole("heading", {
			level: 1,
			name: "Турция: многодневные пешие маршруты",
		}),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Путь Святого Павла" }),
	).toHaveAttribute("href", "/ru/trail/st-paul-trail/");
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		"https://longwalksatlas.com/ru/country/tr/",
	);
});

test("a country with a single trail has no page of its own", async ({
	page,
}) => {
	const lonely = trails
		.flatMap((t) => t.countries)
		.find((code) => countOf((t) => t.countries.includes(code)) === 1);
	test.skip(!lonely, "every country has at least two trails");
	const response = await page.goto(`/en/country/${lonely?.toLowerCase()}/`);
	expect(response?.status()).toBe(404);
});
