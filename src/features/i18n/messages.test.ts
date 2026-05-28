import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(import.meta.dirname, "../../locales");

function keys(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) return [prefix];
	return Object.entries(value).flatMap(([k, v]) =>
		keys(v, prefix ? `${prefix}.${k}` : k),
	);
}

function read(file: string): unknown {
	return JSON.parse(readFileSync(join(dir, file), "utf8"));
}

describe("locale files", () => {
	const reference = keys(read("en.json")).sort();
	const others = readdirSync(dir).filter((f) => f !== "en.json");

	it.each(others)("%s has exactly the keys of en.json", (file) => {
		expect(keys(read(file)).sort()).toEqual(reference);
	});
});
