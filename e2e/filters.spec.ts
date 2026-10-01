import { expect, type Page, test } from "@playwright/test";

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
	await expect(list(page)).toHaveCount(5);

	await page.getByRole("searchbox", { name: "Поиск троп" }).fill("oludeniz");
	await expect(list(page)).toHaveCount(1);
	await expect(list(page)).toHaveText(/Ликийская тропа/);
	await expect(page).toHaveURL(/q=oludeniz/);
});

test("type chips and the country filter combine", async ({ page }) => {
	await page.goto("/ru/");
	await openPanel(page);

	await page.getByRole("button", { name: "Горная тропа" }).click();
	await expect(
		page.getByRole("button", { name: "Горная тропа" }),
	).toHaveAttribute("aria-pressed", "true");
	await expect(list(page)).toHaveText([/Тур вокруг Монблана/]);

	await page.getByRole("button", { name: "Сбросить" }).click();
	await page.getByLabel("Страна").selectOption("TR");
	await expect(list(page)).toHaveCount(2);
	await expect(page).toHaveURL(/country=TR/);
	await expect(page).not.toHaveURL(/type=/);
});

test("a filtered link opens with the filters applied", async ({ page }) => {
	await page.goto("/ru/?type=e-path");
	await openPanel(page);
	await expect(list(page)).toHaveText([/Европейский маршрут E1/]);
});

test.describe("on a phone", () => {
	test.skip(
		({ isMobile }) => !isMobile,
		"tapping a list row is the phone flow",
	);

	test("tapping a trail in the list shows it on the map", async ({ page }) => {
		await page.goto("/ru/");
		await openPanel(page);
		await list(page).filter({ hasText: "Португальский путь" }).click();
		await expect(
			page.getByRole("region", { name: "Португальский путь" }),
		).toBeVisible();
		await expect(page).toHaveURL(/trail=caminho-portugues/);
	});
});
