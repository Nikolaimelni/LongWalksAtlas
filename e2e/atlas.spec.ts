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

test("a trail in the URL opens its preview, and closing it clears the URL", async ({
	page,
}) => {
	await page.goto("/ru/?trail=caminho-portugues");
	const sheet = page.getByRole("region", { name: "Португальский путь" });
	await expect(sheet).toBeVisible();
	await expect(sheet.getByText("Лиссабона через Коимбру")).toBeVisible();
	await expect(
		sheet.getByRole("link", { name: "Подробнее о тропе" }),
	).toHaveAttribute("href", "/ru/trail/caminho-portugues/");

	await sheet.getByRole("button", { name: "Закрыть" }).click();
	await expect(sheet).toBeHidden();
	await expect(page).toHaveURL(/\/ru\/$/);
});

test("the prerendered atlas links to every trail page", async ({ request }) => {
	const html = await (await request.get("/en/")).text();
	for (const slug of [
		"caminho-portugues",
		"e1",
		"lycian-way",
		"st-paul-trail",
		"tour-du-mont-blanc",
	]) {
		expect(html).toContain(`href="/en/trail/${slug}/"`);
	}
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
