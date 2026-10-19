import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { trailsIndex } from "~/features/trails/trails-index";

const flagsDir = join(import.meta.dirname, "../../../public/flags");

describe("flags", () => {
	it("has one for every country on the atlas; run pnpm flags if not", () => {
		const codes = [...new Set(trailsIndex.flatMap((t) => t.countries))];
		const missing = codes.filter(
			(code) => !existsSync(join(flagsDir, `${code.toLowerCase()}.svg`)),
		);
		expect(missing).toEqual([]);
	});
});
