import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { addCsp, cspPolicy } from "./add-csp.ts";

const sha = (text: string) =>
	`'sha256-${createHash("sha256").update(text).digest("base64")}'`;

const page = [
	'<!DOCTYPE html><html lang="ru"><head><meta charSet="utf-8"/><title>Тропа</title></head><body>',
	'<script>window.ctx = {"title":"Ликийская тропа"};</script>',
	'<script type="module" async="">import "/assets/root.js";</script>',
	'<script type="application/ld+json">{"name":"Lycian Way"}</script>',
	'<script src="/assets/entry.js"></script>',
	"</body></html>",
].join("");

describe("addCsp", () => {
	const out = addCsp(page) ?? "";
	const policy =
		/<meta http-equiv="Content-Security-Policy" content="([^"]*)"\/>/.exec(
			out,
		)?.[1] ?? "";

	it("puts the policy straight after the charset and leaves the rest alone", () => {
		expect(out).toContain(
			'<meta charSet="utf-8"/><meta http-equiv="Content-Security-Policy"',
		);
		expect(out.replace(/<meta http-equiv=[^>]*\/>/, "")).toBe(page);
	});

	it("allows each inline script by its hash, Cyrillic included", () => {
		expect(policy).toBe(
			cspPolicy([]).replace(
				"script-src 'self'",
				`script-src 'self' ${sha('window.ctx = {"title":"Ликийская тропа"};')} ${sha('import "/assets/root.js";')}`,
			),
		);
	});

	it("leaves JSON-LD out, since a browser never runs it", () => {
		expect(policy).not.toContain(sha('{"name":"Lycian Way"}'));
	});

	it("refuses a page with no charset to anchor the policy", () => {
		expect(addCsp("<html><head></head><body></body></html>")).toBeUndefined();
	});
});
