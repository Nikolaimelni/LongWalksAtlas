import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	type DefaultTreeAdapterMap,
	parse,
	defaultTreeAdapter as tree,
} from "parse5";
import { DataError } from "./data-error.ts";
import { log } from "./log.ts";

type ParentNode = DefaultTreeAdapterMap["parentNode"];

const client = join(import.meta.dirname, "../build/client");

const scriptTypes = new Set(["", "module", "text/javascript"]);

export function cspPolicy(scriptHashes: readonly string[]): string {
	return [
		"default-src 'self'",
		["script-src 'self'", ...scriptHashes.map((h) => `'sha256-${h}'`)].join(
			" ",
		),
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"connect-src 'self' https://tiles.openfreemap.org",
		"worker-src 'self'",
		"object-src 'none'",
		"base-uri 'none'",
		"form-action 'none'",
	].join("; ");
}

export function addCsp(html: string): string | undefined {
	const document = parse(html, { sourceCodeLocationInfo: true });
	const hashes: string[] = [];
	let charsetEnd: number | undefined;

	const visit = (node: ParentNode) => {
		for (const child of node.childNodes) {
			if (!tree.isElementNode(child)) continue;
			const attr = (name: string) =>
				child.attrs.find((a) => a.name === name)?.value;
			if (child.tagName === "meta" && attr("charset") !== undefined) {
				charsetEnd ??= child.sourceCodeLocation?.endOffset;
			}
			if (
				child.tagName === "script" &&
				attr("src") === undefined &&
				scriptTypes.has((attr("type") ?? "").trim().toLowerCase())
			) {
				const text = child.childNodes
					.map((n) => (tree.isTextNode(n) ? n.value : ""))
					.join("");
				hashes.push(createHash("sha256").update(text).digest("base64"));
			}
			visit(child);
		}
	};
	visit(document);

	if (charsetEnd === undefined) return undefined;
	const meta = `<meta http-equiv="Content-Security-Policy" content="${cspPolicy(hashes)}"/>`;
	return html.slice(0, charsetEnd) + meta + html.slice(charsetEnd);
}

async function main() {
	const files = (await readdir(client, { recursive: true })).filter((f) =>
		f.endsWith(".html"),
	);
	for (const file of files) {
		const path = join(client, file);
		const html = addCsp(await readFile(path, "utf8"));
		if (html === undefined) {
			throw new DataError(
				"csp-failed",
				`${file} has no <meta charset> to put the policy after`,
			);
		}
		await writeFile(path, html);
	}
	log.info({ pages: files.length }, "added csp");
}

if (import.meta.main) {
	main().catch((error: unknown) => {
		if (!(error instanceof DataError)) throw error;
		log.error({ code: error.code }, error.message);
		process.exitCode = 1;
	});
}
