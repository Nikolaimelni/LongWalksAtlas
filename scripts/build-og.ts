import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium, type Page } from "@playwright/test";
import { DataError } from "./data-error.ts";
import { log } from "./log.ts";
import { publishedLanguages as published } from "./published-languages.ts";

const root = join(import.meta.dirname, "..");
// Straight into the build: the cards are made on every deploy and never committed.
const outDir = join(root, "build/client/og");
const port = 4175;
// serve-static.ts listens on 127.0.0.1 only; "localhost" may try ::1 first.
const origin = `http://127.0.0.1:${port}`;
const size = { width: 1200, height: 630 };

async function waitForServer(url: string) {
	for (let i = 0; i < 50; i++) {
		try {
			if ((await fetch(url)).ok) return;
		} catch {
			// not listening yet
		}
		await sleep(200);
	}
	throw new DataError("og-failed", `static server did not start on ${url}`);
}

async function shoot(page: Page, name: string): Promise<void> {
	await page.evaluate(() => document.fonts.ready);
	const image = await page.screenshot({ type: "jpeg", quality: 85 });
	await writeFile(join(outDir, `${name}.jpg`), image);
	log.info(
		{ file: `${name}.jpg`, kb: Math.round(image.length / 1024) },
		"card",
	);
}

async function main() {
	if (!existsSync(join(root, "build/client/index.html"))) {
		throw new DataError(
			"og-failed",
			"no build found; run `pnpm build:deploy`, which builds first",
		);
	}
	const server = spawn(
		process.execPath,
		[join(root, "scripts/serve-static.ts"), "--port", String(port)],
		{ stdio: "ignore" },
	);
	const browser = await chromium.launch();
	try {
		await waitForServer(`${origin}/`);
		const page = await browser.newPage({
			viewport: size,
			deviceScaleFactor: 1,
		});
		await mkdir(outDir, { recursive: true });
		for (const { code } of published) {
			await page.goto(`${origin}/${code}/og-card/`);
			await page.locator("[data-ready]").waitFor({ timeout: 60_000 });
			await shoot(page, `atlas-${code}`);
		}
	} finally {
		await browser.close();
		server.kill();
	}
}

main().catch((error: unknown) => {
	if (!(error instanceof DataError)) throw error;
	log.error({ code: error.code }, error.message);
	process.exitCode = 1;
});
