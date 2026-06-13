import { describe, expect, it } from "vitest";
import { splitFrontmatter } from "./build-content.ts";

describe("splitFrontmatter", () => {
	it("separates the YAML block from the body", () => {
		expect(splitFrontmatter("---\ntitle: A\n---\n\nBody text.\n")).toEqual({
			yaml: "title: A",
			body: "\nBody text.\n",
		});
	});

	it("copes with files saved with Windows line endings", () => {
		expect(splitFrontmatter("---\r\ntitle: A\r\n---\r\nBody\r\n")).toEqual({
			yaml: "title: A",
			body: "Body\n",
		});
	});

	it("keeps a horizontal rule in the body as body", () => {
		expect(splitFrontmatter("---\ntitle: A\n---\nOne\n\n---\n\nTwo").body).toBe(
			"One\n\n---\n\nTwo",
		);
	});

	it("treats a file without frontmatter as all body", () => {
		expect(splitFrontmatter("Just text")).toEqual({
			yaml: "",
			body: "Just text",
		});
	});
});
