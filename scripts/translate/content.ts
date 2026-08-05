import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { marked } from "marked";
import { parse as parseYaml, stringify } from "yaml";
import type { Lang } from "../../src/features/i18n/languages.ts";
import { contentFrontmatterSchema } from "../../src/features/trails/content-schema.ts";
import { splitFrontmatter } from "../build-content.ts";
import type { Translator } from "./ui.ts";

const contentDir = join(import.meta.dirname, "../../data/content");

export type ContentJob = {
	slug: string;
	lang: Exclude<Lang, "en">;
	path: string;
};

export async function planContent(
	slugs: readonly string[],
	langs: readonly Exclude<Lang, "en">[],
	force: boolean,
): Promise<ContentJob[]> {
	const jobs: ContentJob[] = [];
	for (const slug of slugs) {
		for (const lang of langs) {
			const path = join(contentDir, slug, `${lang}.md`);
			if (existsSync(path)) {
				if (!force) continue;
				const { yaml } = splitFrontmatter(await readFile(path, "utf8"));
				const meta = contentFrontmatterSchema.safeParse(parseYaml(yaml));
				if (meta.success && meta.data.status === "reviewed") continue;
			}
			jobs.push({ slug, lang, path });
		}
	}
	return jobs;
}

export async function readEnglish(slug: string) {
	const { yaml, body } = splitFrontmatter(
		await readFile(join(contentDir, slug, "en.md"), "utf8"),
	);
	const meta = contentFrontmatterSchema.parse(parseYaml(yaml));
	return {
		title: meta.title,
		summary: meta.summary,
		html: await marked.parse(body.trim()),
	};
}

export async function translateContent(
	job: ContentJob,
	translate: Translator,
): Promise<void> {
	const en = await readEnglish(job.slug);
	const [title = "", summary = ""] = await translate(
		[en.title, en.summary],
		job.lang,
		"plain",
	);
	const [html = ""] = en.html
		? await translate([en.html], job.lang, "html")
		: [""];
	const front = stringify({ title, summary, status: "machine" });
	await writeFile(job.path, `---\n${front}---\n\n${html.trim()}\n`);
}

export function characters(en: {
	title: string;
	summary: string;
	html: string;
}): number {
	return en.title.length + en.summary.length + en.html.length;
}
