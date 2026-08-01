import { expect, test } from "@playwright/test";

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
	await expect(
		page.getByText("Сколько дней идти маршрут «Ликийская тропа»?"),
	).toBeVisible();
	await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
	await expect(
		page
			.getByRole("region", { name: "Тропы рядом" })
			.getByRole("link", { name: /Путь Святого Павла/ }),
	).toHaveAttribute("href", "/ru/trail/st-paul-trail/");
});

test("a trail page is described for search engines", async ({ page }) => {
	await page.goto("/en/trail/tour-du-mont-blanc/");
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		"https://longwalksatlas.com/en/trail/tour-du-mont-blanc/",
	);
	await expect(page.locator('link[rel="alternate"]')).toHaveCount(12);
	const ld = JSON.parse(
		(await page.locator('script[type="application/ld+json"]').textContent()) ??
			"{}",
	);
	expect(ld["@graph"][0]).toMatchObject({
		"@type": "TouristAttraction",
		name: "Tour du Mont Blanc",
	});
});

test("sitemap, robots.txt and llms.txt are published", async ({ request }) => {
	const sitemap = await (await request.get("/sitemap.xml")).text();
	expect(sitemap).toContain(
		"<loc>https://longwalksatlas.com/ja/trail/e1/</loc>",
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
		"Page not found",
	);
	await expect(
		page.getByRole("link", { name: "Go to the map of all trails" }),
	).toHaveAttribute("href", "/");
});

test("a path without its trailing slash is redirected to it", async ({
	page,
}) => {
	await page.goto("/en/trail/e1");
	await expect(page).toHaveURL(/\/en\/trail\/e1\/$/);
});
