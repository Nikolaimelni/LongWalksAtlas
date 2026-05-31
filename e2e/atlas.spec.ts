import { expect, test } from "@playwright/test";

test.describe("with a Russian browser", () => {
	test.use({ locale: "ru-RU" });

	test("/ sends the visitor to their language", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/ru\/$/);
		await expect(page.getByText("Атлас троп")).toBeVisible();
	});
});

test("the atlas draws a map", async ({ page }) => {
	await page.goto("/en/");
	await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
});

test("switching language keeps the page and remembers the choice", async ({
	page,
}) => {
	await page.goto("/en/");
	await page
		.getByRole("combobox", { name: "Language" })
		.selectOption("العربية");
	await expect(page).toHaveURL(/\/ar\/$/);
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

	await page.goto("/");
	await expect(page).toHaveURL(/\/ar\/$/);
});
