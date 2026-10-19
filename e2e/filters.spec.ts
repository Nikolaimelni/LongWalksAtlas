import { expect, type Page, test } from "@playwright/test";
import { countOf, ruTitle, trails } from "./trail-data";

const list = (page: Page) =>
	page
		.getByRole("region", { name: "Тропы" })
		.getByRole("list", { name: /\d+ троп/ })
		.getByRole("listitem");

async function openPanel(page: Page) {
	const toggle = page.getByRole("button", { name: /\d+ троп/ });
	if (await toggle.isVisible()) await toggle.click();
}

test("search narrows the list and lands in the URL", async ({ page }) => {
	await page.goto("/ru/");
	await openPanel(page);
	await expect(list(page)).toHaveCount(trails.length);

	await page.getByRole("searchbox", { name: "Поиск троп" }).fill("oludeniz");
	await expect(list(page)).toHaveCount(1);
	await expect(list(page)).toHaveText(new RegExp(ruTitle("lycian-way")));
	await expect(page).toHaveURL(/q=oludeniz/);
});

test("type chips and the country filter combine", async ({ page }) => {
	await page.goto("/ru/");
	await openPanel(page);

	await page.getByRole("button", { name: "Паломнический путь" }).click();
	await expect(
		page.getByRole("button", { name: "Паломнический путь" }),
	).toHaveAttribute("aria-pressed", "true");
	await expect(list(page)).toHaveCount(countOf((t) => t.type === "pilgrimage"));

	await page.getByLabel("Страна").selectOption("ES");
	await expect(list(page)).toHaveCount(
		countOf((t) => t.type === "pilgrimage" && t.countries.includes("ES")),
	);
	await expect(page).toHaveURL(/type=pilgrimage/);
	await expect(page).toHaveURL(/country=ES/);

	await page.getByRole("button", { name: "Сбросить" }).click();
	await expect(list(page)).toHaveCount(trails.length);
	await expect(page).not.toHaveURL(/type=|country=/);
});

test("a filtered link opens with the filters applied", async ({ page }) => {
	await page.goto("/ru/?type=e-path");
	await openPanel(page);
	await expect(list(page)).toHaveCount(countOf((t) => t.type === "e-path"));
	await expect(list(page).first()).toHaveText(/E1/);
});

test.describe("on a phone", () => {
	test.skip(
		({ isMobile }) => !isMobile,
		"tapping a list row is the phone flow",
	);

	test("tapping a trail in the list shows it, and Back closes it", async ({
		page,
	}) => {
		await page.goto("/ru/");
		await openPanel(page);
		await list(page).filter({ hasText: "Португальский путь" }).click();
		await expect(
			page.getByRole("region", { name: "Португальский путь" }),
		).toBeVisible();
		await expect(page).toHaveURL(/trail=caminho-portugues/);

		await page.goBack();
		await expect(
			page.getByRole("region", { name: "Португальский путь" }),
		).toBeHidden();
		await expect(page).toHaveURL(/\/ru\/$/);
	});

	test("a tap on the map folds the list away", async ({ page }) => {
		await page.goto("/ru/");
		await openPanel(page);
		await expect(list(page).first()).toBeVisible();
		await page
			.locator("canvas.maplibregl-canvas")
			.click({ position: { x: 40, y: 140 } });
		await expect(list(page).first()).toBeHidden();
	});

	test("the type chips scroll in their row, not the panel", async ({
		page,
	}) => {
		await page.goto("/ru/");
		await openPanel(page);
		const chips = await page.getByRole("group", { name: "Тип" }).boundingBox();
		expect(chips?.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
	});
});
