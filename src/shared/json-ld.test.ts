import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
	it("cannot be used to close the script tag", () => {
		const out = serializeJsonLd({ text: "</script><script>alert(1)</script>" });
		expect(out).not.toContain("</script>");
		expect(JSON.parse(out)).toEqual({
			text: "</script><script>alert(1)</script>",
		});
	});
});
