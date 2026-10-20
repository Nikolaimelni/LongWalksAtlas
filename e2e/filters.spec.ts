import { expect, type Page, test } from "@playwright/test";
import { countOf, ruTitle, trails } from "./trail-data";

const list = (page: Page) =>
	page
		.getByRole("region", { name: "Тропы" })
		.getByRole("list", { name: /\d+ троп/ })
		.getByRole("listitem");

async function openPanel(page: Page) {
	const toggle = page.getByRole("button", { name: /\d+ троп/ });
	if ((await toggle.getAttribute("aria-expanded")) === "false") {
		await toggle.click();
	}
}

async function openFilters(page: Page) {
	const toggle = page.getByRole("button", { name: /^Фильтры/ });
	if ((await toggle.getAttribute("aria-expanded")) === "false") {
		await toggle.click();
	}
	return toggle;
}

test("search narrows the list and lands in the URL", async ({ page }) => {
	await page.goto("/ru/");
	await openPanel(page);
	await expect(list(page)).toHaveCount(trails.length);

	await page.getByRole("searchbox", { name: "Поиск троп" }).fill("oludeniz");
	await expect(list(page)).toHaveCount(1);
	await expect(list(page)).toHaveText(new RegExp(ruTitle("lycian-way")));
	await expect(page).toHaveURL(/q=oludeniz/);

	await page.getByRole("button", { name: "Очистить поиск" }).click();
	await expect(page.getByRole("searchbox", { name: "Поиск троп" })).toHaveValue(
		"",
	);
	await expect(list(page)).toHaveCount(trails.length);
	await expect(page).not.toHaveURL(/q=/);
});

test("type chips and the country filter combine", async ({ page }) => {
	await page.goto("/ru/");
	await openPanel(page);
	await openFilters(page);

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

test("two regions together, counted on the folded filters", async ({
	page,
}) => {
	await page.goto("/ru/");
	await openPanel(page);
	const filters = await openFilters(page);
	await page.getByRole("button", { name: "Европа" }).click();
	await page.getByRole("button", { name: "Африка" }).click();
	await expect(list(page)).toHaveCount(
		countOf((t) => t.region === "europe" || t.region === "africa"),
	);
	await expect(page).toHaveURL(/region=europe%2Cafrica/);

	await filters.click();
	await expect(page.getByRole("button", { name: "Европа" })).toBeHidden();
	await expect(filters).toHaveAccessibleName(/включено 2 фильтра/);
});

test("a filtered link opens with the filters applied", async ({ page }) => {
	await page.goto("/ru/?type=forest");
	await openPanel(page);
	await expect(list(page)).toHaveCount(countOf((t) => t.type === "forest"));
	await expect(list(page).filter({ hasText: "E1" })).toHaveCount(1);
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

	test("a swipe down on the handle closes the trail sheet", async ({
		page,
	}) => {
		await page.goto("/ru/?trail=caminho-portugues");
		const sheet = page.getByRole("region", { name: "Португальский путь" });
		await expect(sheet).toBeVisible();
		// The handle is aria-hidden, so there is no role to find it by. hover() waits
		// for the sheet to finish sliding in before the drag measures it.
		const grip = sheet.locator("[aria-hidden=true].cursor-grab");
		await grip.hover();
		const handle = await grip.boundingBox();
		if (!handle) throw new Error("no handle");
		const x = handle.x + handle.width / 2;
		const y = handle.y + handle.height / 2;
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x, y + 120, { steps: 5 });
		await page.mouse.up();
		await expect(sheet).toBeHidden();
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

	test("a tap on the bar's handle opens the list, not a trail under it", async ({
		page,
	}) => {
		await page.goto("/ru/");
		await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
		await page
			.getByRole("region", { name: "Тропы" })
			.locator("[aria-hidden=true].cursor-grab")
			.tap();
		await expect(list(page).first()).toBeVisible();
		await expect(page).toHaveURL(/\/ru\/$/);
	});

	test("a tap on the bar closes the trail sheet and does what it does", async ({
		page,
	}) => {
		const sheet = page.getByRole("region", { name: "Португальский путь" });
		const toggle = page.getByRole("button", { name: /\d+ троп/ });

		await page.goto("/ru/?trail=caminho-portugues");
		await expect(sheet).toBeVisible();
		await toggle.tap();
		await expect(sheet).toBeHidden();
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(
			page.getByRole("button", { name: /^Фильтры/ }),
		).toHaveAttribute("aria-expanded", "true");
		await expect(page).toHaveURL(/\/ru\/$/);

		await page.goto("/ru/?trail=caminho-portugues");
		await expect(sheet).toBeVisible();
		await page
			.getByRole("region", { name: "Тропы" })
			.locator("[aria-hidden=true].cursor-grab")
			.tap();
		await expect(sheet).toBeHidden();
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
		await expect(page).toHaveURL(/\/ru\/$/);
	});

	test("a tap on the map only closes the trail sheet", async ({ page }) => {
		const sheet = page.getByRole("region", { name: "Португальский путь" });
		await page.goto("/ru/?trail=caminho-portugues");
		await expect(sheet).toBeVisible();
		await page
			.locator("canvas.maplibregl-canvas")
			.tap({ position: { x: 40, y: 140 } });
		await expect(sheet).toBeHidden();
		await expect(page).toHaveURL(/\/ru\/$/);
	});

	test("a tap on the language switcher closes the trail sheet and opens the menu", async ({
		page,
	}) => {
		const sheet = page.getByRole("region", { name: "Португальский путь" });
		await page.goto("/ru/?trail=caminho-portugues");
		await expect(sheet).toBeVisible();
		await page.getByRole("button", { name: /Русский/ }).tap();
		await expect(sheet).toBeHidden();
		await expect(page.getByRole("link", { name: "English" })).toBeVisible();
	});

	test("the type chips scroll in their row, not the panel", async ({
		page,
	}) => {
		await page.goto("/ru/");
		await openPanel(page);
		await openFilters(page);
		const chips = await page.getByRole("group", { name: "Тип" }).boundingBox();
		expect(chips?.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
	});
});
