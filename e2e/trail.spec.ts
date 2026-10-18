import { expect, test } from "@playwright/test";
import { publishedLanguages, trails } from "./trail-data";

test("a trail page carries the facts, the story and the official link", async ({
	page,
}) => {
	await page.goto("/ru/trail/lycian-way/");
	await expect(
		page.getByRole("heading", { level: 1, name: "Ликийская тропа" }),
	).toBeVisible();
	await expect(page.getByText("Likya Yolu")).toBeVisible();
	await expect(page.getByText("760 км").first()).toBeVisible();
	await expect(
		page.getByRole("link", { name: /Официальный сайт/ }),
	).toHaveAttribute(
		"href",
		"https://cultureroutesinturkey.com/the-lycian-way/",
	);
	await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
	await expect(page.getByText("Линия на карте схематична")).toBeVisible();
	await expect(
		page.getByRole("link", { name: "cultureroutesinturkey.com" }),
	).toHaveAttribute(
		"href",
		"https://cultureroutesinturkey.com/the-lycian-way/",
	);
	await expect(
		page
			.getByRole("region", { name: "Тропы рядом" })
			.getByRole("link", { name: /Путь Святого Павла/ }),
	).toHaveAttribute("href", "/ru/trail/st-paul-trail/");
});

test("days worked out from the length are marked as an estimate", async ({
	page,
}) => {
	const estimated = trails.find((t) => t.daysSource === "estimate");
	test.skip(!estimated, "every trail has its days from a source");
	await page.goto(`/en/trail/${estimated?.slug}/`);
	await expect(
		page.getByRole("definition").filter({ hasText: /^≈\s\d/ }),
	).toBeVisible();
	await expect(
		page.getByText("No source gives the days on foot", { exact: false }),
	).toBeVisible();
});

test("a trail page is described for search engines", async ({ page }) => {
	await page.goto("/en/trail/tour-du-mont-blanc/");
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		"https://longwalksatlas.com/en/trail/tour-du-mont-blanc/",
	);
	// Every published language plus x-default: the Tour du Mont Blanc is in all of them.
	await expect(page.locator('link[rel="alternate"]')).toHaveCount(
		publishedLanguages + 1,
	);
	const ld = JSON.parse(
		(await page.locator('script[type="application/ld+json"]').textContent()) ??
			"{}",
	);
	expect(ld["@graph"][0]).toMatchObject({
		"@type": "TouristAttraction",
		name: "Tour du Mont Blanc",
	});
});

test("the atlas has a large social card, the card page stays out of search", async ({
	page,
	request,
}) => {
	await page.goto("/ru/");
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
		"content",
		/^https:\/\/longwalksatlas\.com\/og\/atlas-ru-[0-9a-f]{8}\.jpg$/,
	);
	await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
		"content",
		"summary_large_image",
	);
	await page.goto("/ru/og-card/");
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
		"content",
		"noindex",
	);
	expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
		"og-card",
	);
});

test("sitemap, robots.txt and llms.txt are published", async ({ request }) => {
	const sitemap = await (await request.get("/sitemap.xml")).text();
	expect(sitemap).toContain(
		"<loc>https://longwalksatlas.com/ru/trail/e1/</loc>",
	);
	expect(await (await request.get("/robots.txt")).text()).toContain(
		"Sitemap: https://longwalksatlas.com/sitemap.xml",
	);
	expect(await (await request.get("/llms.txt")).text()).toContain(
		"[Portuguese Way](https://longwalksatlas.com/en/trail/caminho-portugues/)",
	);
});

test("an unknown trail answers 404 and points back to the map", async ({
	page,
}) => {
	const response = await page.goto("/en/trail/no-such-trail/");
	expect(response?.status()).toBe(404);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"This trail ends here",
	);
	await expect(
		page.getByRole("link", { name: "Back to the map" }),
	).toHaveAttribute("href", "/en/");
});

test("a path without its trailing slash is redirected to it", async ({
	page,
}) => {
	await page.goto("/en/trail/e1");
	await expect(page).toHaveURL(/\/en\/trail\/e1\/$/);
});
