import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { log } from "./log.ts";
import { readTrails } from "./read-trails.ts";

// Emoji flags come out as two letters on Windows, so the site serves its own SVGs, and
// only for the countries the atlas has: flag-icons holds about 270 of them.
const sourceDir = join(
	import.meta.dirname,
	"../node_modules/flag-icons/flags/4x3",
);
const outDir = join(import.meta.dirname, "../public/flags");

const trails = await readTrails();
const codes = [...new Set(trails.flatMap((t) => t.countries))]
	.map((code) => code.toLowerCase())
	.sort();

await mkdir(outDir, { recursive: true });
for (const code of codes) {
	await copyFile(join(sourceDir, `${code}.svg`), join(outDir, `${code}.svg`));
}
const stale = (await readdir(outDir)).filter(
	(file) => !codes.includes(file.replace(/\.svg$/, "")),
);
for (const file of stale) await rm(join(outDir, file));

log.info({ flags: codes.length, removed: stale.length }, "wrote flags");
