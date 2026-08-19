import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "@playwright/test";
import { languages } from "../src/features/i18n/languages.ts";
import { DataError } from "./data-error.ts";
import { log } from "./log.ts";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "public/og");
const indexFile = join(root, "src/generated/og.json");
const port = 4175;
const size = { width: 1200, height: 630 };

const published = languages.filter(({ code }) =>
	existsSync(join(root, "src/locales", `${code}.json`)),
);

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

async function main() {
	if (!existsSync(join(root, "build/client/index.html"))) {
		throw new DataError(
			"og-failed",
			"no build found; run `pnpm og`, which builds first",
		);
	}
	const server = spawn(
		process.execPath,
		[join(root, "scripts/serve-static.ts"), "--port", String(port)],
		{ stdio: "ignore" },
	);
	const browser = await chromium.launch();
	try {
		await waitForServer(`http://localhost:${port}/`);
		const page = await browser.newPage({
			viewport: size,
			deviceScaleFactor: 1,
		});
		await mkdir(outDir, { recursive: true });
		const cards: Record<
			string,
			{ src: string; width: number; height: number }
		> = {};

		for (const { code } of published) {
			await page.goto(`http://localhost:${port}/${code}/og-card/`);
			await page.locator("[data-ready]").waitFor({ timeout: 60_000 });
			await page.evaluate(() => document.fonts.ready);
			const image = await page.screenshot({ type: "jpeg", quality: 85 });
			const hash = createHash("sha1").update(image).digest("hex").slice(0, 8);
			const name = `atlas-${code}-${hash}.jpg`;
			await writeFile(join(outDir, name), image);
			cards[code] = { src: `/og/${name}`, ...size };
			log.info(
				{ lang: code, file: name, kb: Math.round(image.length / 1024) },
				"card",
			);
		}

		const keep = new Set(
			Object.values(cards).map((c) => c.src.replace("/og/", "")),
		);
		for (const name of await readdir(outDir)) {
			if (!keep.has(name)) await rm(join(outDir, name));
		}
		await writeFile(indexFile, `${JSON.stringify(cards, null, "\t")}\n`);
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
