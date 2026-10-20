import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DataError } from "./data-error.ts";
import { log } from "./log.ts";
import { publishedLanguages } from "./published-languages.ts";

const client = join(import.meta.dirname, "../build/client");
const assets = join(client, "assets");

const files = await readdir(assets);
const entries = files.filter((f) => /^atlas-map-[\w-]+\.js$/.test(f));
if (entries.length !== 1) {
	throw new DataError(
		"map-preload-failed",
		`expected one atlas-map chunk in build/client/assets, found ${entries.length}`,
	);
}

const chunks = new Set<string>();
const walk = async (file: string) => {
	if (chunks.has(file)) return;
	chunks.add(file);
	const code = await readFile(join(assets, file), "utf8");
	for (const [, dep] of code.matchAll(/from\s*"\.\/([\w.-]+\.js)"/g)) {
		if (dep) await walk(dep);
	}
};
await walk(entries[0] as string);
const styles = files.filter((f) => /^map-style-[\w-]+\.css$/.test(f));

for (const { code } of publishedLanguages) {
	const page = join(client, code, "index.html");
	const html = await readFile(page, "utf8");
	const tags = [
		...[...chunks]
			.filter((f) => !html.includes(`/assets/${f}"`))
			.map((f) => `<link rel="modulepreload" href="/assets/${f}"/>`),
		...styles
			.filter((f) => !html.includes(`/assets/${f}"`))
			.map((f) => `<link rel="preload" as="style" href="/assets/${f}"/>`),
	].join("");
	const at = html.indexOf('<link rel="modulepreload"');
	if (at === -1) {
		throw new DataError(
			"map-preload-failed",
			`${page} has no modulepreload links`,
		);
	}
	await writeFile(page, html.slice(0, at) + tags + html.slice(at));
}
log.info(
	{ chunks: chunks.size, pages: publishedLanguages.length },
	"preloaded the map on atlas pages",
);
