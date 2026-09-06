import { expect, type Page, test } from "@playwright/test";

function collectViolations(page: Page): string[] {
	const violations: string[] = [];
	page.on("console", (message) => {
		if (
			message.type() === "error" &&
			message.text().includes("Content Security Policy")
		) {
			violations.push(message.text());
		}
	});
	return violations;
}

test("the atlas and a trail page run under their policy without tripping it", async ({
	page,
}) => {
	const violations = collectViolations(page);
	await page.goto("/en/");
	await expect(
		page.locator('meta[http-equiv="Content-Security-Policy"]'),
	).toHaveCount(1);
	await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();

	await page.goto("/ru/trail/lycian-way/");
	await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
	await page.waitForLoadState("networkidle");

	await page.getByRole("link", { name: "Показать на карте" }).click();
	await expect(page).toHaveURL(/\/ru\/\?trail=lycian-way$/);
	await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
	await page.waitForLoadState("networkidle");

	expect(violations).toEqual([]);
});

test("a script added to the page after load is refused and reported", async ({
	page,
}) => {
	const violations = collectViolations(page);
	await page.goto("/en/");
	const ran = await page.evaluate(() => {
		const script = document.createElement("script");
		script.textContent = "document.body.dataset.injected = 'yes'";
		document.body.append(script);
		return document.body.dataset.injected ?? "no";
	});
	expect(ran).toBe("no");
	await expect.poll(() => violations.length).toBe(1);
});
