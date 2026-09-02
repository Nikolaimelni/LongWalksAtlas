import { describe, expect, it } from "vitest";
import { parseStoryHtml } from "./story-html.ts";

describe("parseStoryHtml", () => {
	it("passes what markdown makes of a story", () => {
		const html =
			'<p>Waymarked in <em>1999</em>, see <a href="https://cultureroutesinturkey.com/" title="Culture Routes">the society</a>.</p>\n<ol start="3">\n<li>Kaş</li>\n</ol>\n<p><a href="/en/trail/st-paul-trail/">St Paul</a></p>';
		expect(parseStoryHtml(html)).toEqual({ html, problems: [] });
	});

	it("refuses scripts, other tags and event handlers", () => {
		const { problems } = parseStoryHtml(
			'<p>a</p><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://example.com"></iframe><p onclick="alert(1)">b</p><svg><a href="https://example.com">c</a></svg>',
		);
		expect(problems).toEqual([
			"<script> is not allowed",
			"<img> is not allowed",
			"<iframe> is not allowed",
			"<p onclick> is not allowed",
			"<svg> is not allowed",
		]);
	});

	it("refuses links a browser would run or open as a document", () => {
		for (const href of [
			"javascript:alert(1)",
			" JavaScript:alert(1)",
			"java\tscript:alert(1)",
			"jav&#x61;script:alert(1)",
			"data:text/html,<script>alert(1)</script>",
			"vbscript:msgbox(1)",
		]) {
			expect(parseStoryHtml(`<a href="${href}">x</a>`).problems).toHaveLength(
				1,
			);
		}
	});

	it("writes the story back from the tree, so markup around it stays intact", () => {
		expect(parseStoryHtml("<p>one</div></section><p><em>two").html).toBe(
			"<p>one</p><p><em>two</em></p>",
		);
	});
});
