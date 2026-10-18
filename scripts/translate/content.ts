import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { marked } from "marked";
import { parse as parseYaml } from "yaml";
import type { Lang } from "../../src/features/i18n/languages.ts";
import { contentFrontmatterSchema } from "../../src/features/trails/content-schema.ts";
import { splitFrontmatter } from "../build-content.ts";
import { readTranslations, type Translation } from "../translations.ts";
import type { Translator } from "./ui.ts";

const contentDir = join(import.meta.dirname, "../../data/content");

export type ContentJob = {
	slug: string;
	lang: Exclude<Lang, "en">;
};

// A trail with its own <lang>.md is left alone: that file is a person's text. Otherwise
// it is translated once, or again with --force.
export async function planContent(
	slugs: readonly string[],
	langs: readonly Exclude<Lang, "en">[],
	force: boolean,
): Promise<ContentJob[]> {
	const jobs: ContentJob[] = [];
	for (const lang of langs) {
		const done = await readTranslations(lang);
		for (const slug of slugs) {
			if (existsSync(join(contentDir, slug, `${lang}.md`))) continue;
			if (done[slug] && !force) continue;
			jobs.push({ slug, lang });
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
): Promise<Translation> {
	const en = await readEnglish(job.slug);
	const [title = "", summary = ""] = await translate(
		[en.title, en.summary],
		job.lang,
		"plain",
	);
	const [html = ""] = en.html
		? await translate([en.html], job.lang, "html")
		: [""];
	return { title, summary, html: html.trim() };
}

export function characters(en: {
	title: string;
	summary: string;
	html: string;
}): number {
	return en.title.length + en.summary.length + en.html.length;
}
