import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { chromium, type Page } from "@playwright/test";
import { DataError } from "./data-error.ts";
import { log } from "./log.ts";
import { publishedLanguages as published } from "./published-languages.ts";
import { readTrails } from "./read-trails.ts";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "public/og");
const indexFile = join(root, "src/generated/og.json");
const port = 4175;
// serve-static.ts listens on 127.0.0.1 only; "localhost" may try ::1 first.
const origin = `http://127.0.0.1:${port}`;
const size = { width: 1200, height: 630 };

type Card = { src: string; width: number; height: number };
type Cards = {
	atlas: Record<string, Card>;
	trails: Record<string, Record<string, Card>>;
};

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

async function shoot(page: Page, name: string): Promise<Card> {
	await page.evaluate(() => document.fonts.ready);
	const image = await page.screenshot({ type: "jpeg", quality: 85 });
	const hash = createHash("sha1").update(image).digest("hex").slice(0, 8);
	const file = `${name}-${hash}.jpg`;
	await writeFile(join(outDir, file), image);
	log.info({ file, kb: Math.round(image.length / 1024) }, "card");
	return { src: `/og/${file}`, ...size };
}

// Trail cards are 78 trails times every language, close to a thousand JPEGs in git,
// so they are only made on request (--trails). Without it the ones already made stay.
async function main() {
	const { values } = parseArgs({
		options: { trails: { type: "boolean", default: false } },
	});
	const previous: Cards = existsSync(indexFile)
		? JSON.parse(await readFile(indexFile, "utf8"))
		: { atlas: {}, trails: {} };
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
		await waitForServer(`${origin}/`);
		const page = await browser.newPage({
			viewport: size,
			deviceScaleFactor: 1,
		});
		await mkdir(outDir, { recursive: true });
		const atlas: Record<string, Card> = {};
		const trails: Cards["trails"] = values.trails ? {} : previous.trails;

		for (const { code } of published) {
			await page.goto(`${origin}/${code}/og-card/`);
			await page.locator("[data-ready]").waitFor({ timeout: 60_000 });
			atlas[code] = await shoot(page, `atlas-${code}`);
		}
		for (const { slug } of values.trails ? await readTrails() : []) {
			const byLang: Record<string, Card> = {};
			for (const { code } of published) {
				await page.goto(`${origin}/${code}/og-card/trail/${slug}/`, {
					waitUntil: "networkidle",
				});
				byLang[code] = await shoot(page, `trail-${slug}-${code}`);
			}
			trails[slug] = byLang;
		}

		const keep = new Set(
			[atlas, ...Object.values(trails)]
				.flatMap((byLang) => Object.values(byLang))
				.map((c) => c.src.replace("/og/", "")),
		);
		for (const name of await readdir(outDir)) {
			if (!keep.has(name)) await rm(join(outDir, name));
		}
		await writeFile(
			indexFile,
			`${JSON.stringify({ atlas, trails }, null, "\t")}\n`,
		);
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
