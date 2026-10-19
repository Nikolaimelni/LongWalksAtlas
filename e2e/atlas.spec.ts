import { expect, test } from "@playwright/test";
import { trails } from "./trail-data";

test.describe("with a Russian browser", () => {
	test.use({ locale: "ru-RU" });

	test("/ sends the visitor to their language", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/ru\/$/);
		await expect(page.getByText("Long Walks Atlas")).toBeVisible();
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
	await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
});

// Text that differs between the prerendered HTML and the first client render makes
// React throw the page away and draw it again; country names once did.
test("the prerendered atlas hydrates without a mismatch", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text());
	});
	for (const lang of ["en", "ru", "de"]) {
		await page.goto(`/${lang}/`);
		await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
	}
	expect(
		errors.filter((e) =>
			/hydrat|Minified React error #4(18|19|23|25)/i.test(e),
		),
	).toEqual([]);
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
	// The photo credit leads off the site, so it must not replace the map.
	await expect(
		sheet.getByRole("figure").getByRole("link").first(),
	).toHaveAttribute("target", "_blank");

	await sheet.getByRole("button", { name: "Закрыть" }).click();
	await expect(sheet).toBeHidden();
	await expect(page).toHaveURL(/\/ru\/$/);
});

test("the prerendered atlas links to every trail page", async ({ request }) => {
	const html = await (await request.get("/en/")).text();
	for (const { slug } of trails) {
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

test("the privacy page is linked from the map and says what is collected", async ({
	page,
}) => {
	await page.goto("/en/");
	await page.getByRole("link", { name: "Privacy and terms" }).click();
	await expect(page).toHaveURL(/\/en\/privacy\/$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Privacy and terms" }),
	).toBeVisible();
	await expect(page.getByText("Cloudflare Web Analytics")).toBeVisible();
});
