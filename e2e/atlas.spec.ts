import { expect, test } from "@playwright/test";

test.describe("with a Russian browser", () => {
	test.use({ locale: "ru-RU" });

	test("/ sends the visitor to their language", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/ru\/$/);
		await expect(page.getByText("Атлас троп")).toBeVisible();
	});
});

test.describe("on a device set to dark", () => {
	test.use({ colorScheme: "dark" });

	test("the atlas loads the dark basemap", async ({ page }) => {
		const style = page.waitForRequest(/tiles\.openfreemap\.org\/styles\/dark$/);
		await page.goto("/en/");
		await style;
		await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
	});
});

test("the atlas draws a map and says the lines are schematic", async ({
	page,
}) => {
	await page.goto("/en/");
	await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
	await expect(page.getByText("Lines on the map are schematic")).toBeVisible();
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
	await page.goto("/en/trail/e1/");
	await page.getByRole("button", { name: /^Language/ }).click();
	await page.getByRole("link", { name: "Русский" }).click();
	await expect(page).toHaveURL(/\/ru\/trail\/e1\/$/);
	await expect(page.locator("html")).toHaveAttribute("lang", "ru");

	await page.goto("/");
	await expect(page).toHaveURL(/\/ru\/$/);
});

test("a language without interface strings is not published", async ({
	page,
	request,
}) => {
	expect((await request.get("/ja/")).status()).toBe(404);
	expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
		"/ja/",
	);
	await page.goto("/en/");
	await expect(page.locator('link[hreflang="ja"]')).toHaveCount(0);
	await expect(page.locator('link[hreflang="ru"]')).toHaveCount(1);
});
