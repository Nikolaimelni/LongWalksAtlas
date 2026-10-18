import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { marked } from "marked";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import {
	defaultLang,
	isLang,
	type Lang,
	languages,
} from "../src/features/i18n/languages.ts";
import {
	contentFrontmatterSchema,
	type TrailContent,
} from "../src/features/trails/content-schema.ts";
import { DataError } from "./data-error.ts";
import { log } from "./log.ts";
import { parseStoryHtml } from "./story-html.ts";
import { readTranslations, type Translations } from "./translations.ts";

const root = join(import.meta.dirname, "..");
const trailsDir = join(root, "data/trails");
const contentDir = join(root, "data/content");
const outDir = join(root, "src/generated/content");

type Parsed = { meta: z.infer<typeof contentFrontmatterSchema>; html: string };

export function splitFrontmatter(text: string): { yaml: string; body: string } {
	const normalized = text.replace(/\r\n/g, "\n");
	const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
	if (!match) return { yaml: "", body: normalized };
	return { yaml: match[1] ?? "", body: match[2] ?? "" };
}

async function parseFile(file: string): Promise<Parsed | string> {
	const { yaml, body } = splitFrontmatter(await readFile(file, "utf8"));
	let raw: unknown;
	try {
		raw = parseYaml(yaml);
	} catch (error) {
		return `frontmatter is not valid YAML (${String(error)})`;
	}
	const meta = contentFrontmatterSchema.safeParse(raw);
	if (!meta.success) return z.prettifyError(meta.error);
	const story = parseStoryHtml(await marked.parse(body.trim()));
	if (story.problems.length > 0) return story.problems.join("\n");
	return { meta: meta.data, html: story.html };
}

async function main() {
	const slugs = (await readdir(trailsDir))
		.filter((f) => f.endsWith(".json"))
		.map((f) => basename(f, ".json"))
		.sort();
	const problems: string[] = [];
	const parsed = new Map<string, Partial<Record<Lang, Parsed>>>();
	const translations = new Map<Lang, Translations>();
	for (const { code } of languages) {
		translations.set(code, await readTranslations(code));
	}

	for (const slug of slugs) {
		const dir = join(contentDir, slug);
		const files = existsSync(dir) ? await readdir(dir) : [];
		const byLang: Partial<Record<Lang, Parsed>> = {};
		for (const file of files.filter((f) => f.endsWith(".md"))) {
			const lang = basename(file, ".md");
			if (!isLang(lang)) {
				problems.push(`${slug}/${file}: "${lang}" is not a site language`);
				continue;
			}
			const result = await parseFile(join(dir, file));
			if (typeof result === "string")
				problems.push(`${slug}/${file}\n${result}`);
			else byLang[lang] = result;
		}
		if (!byLang[defaultLang])
			problems.push(`${slug}: missing ${defaultLang}.md`);
		for (const [lang, entries] of translations) {
			const entry = entries[slug];
			if (byLang[lang] || !entry) continue;
			const story = parseStoryHtml(entry.html);
			if (story.problems.length > 0) {
				problems.push(
					`translations/${lang}.json, ${slug}\n${story.problems.join("\n")}`,
				);
				continue;
			}
			byLang[lang] = {
				meta: { title: entry.title, summary: entry.summary, status: "machine" },
				html: story.html,
			};
		}
		parsed.set(slug, byLang);
	}

	if (problems.length > 0) {
		throw new DataError("invalid-content", problems.join("\n\n"));
	}

	await rm(outDir, { recursive: true, force: true });
	for (const { code } of languages) {
		await mkdir(join(outDir, code), { recursive: true });
		const index: Record<string, TrailContent> = {};
		for (const [slug, byLang] of parsed) {
			const lang = byLang[code] ? code : defaultLang;
			const entry = byLang[lang];
			if (!entry) continue;
			index[slug] = { ...entry.meta, lang };
			await writeFile(join(outDir, code, `${slug}.html`), entry.html);
		}
		await writeFile(join(outDir, `${code}.json`), JSON.stringify(index));
	}
	log.info(
		{ trails: parsed.size, languages: languages.length },
		"wrote content",
	);
}

if (import.meta.main) {
	main().catch((error: unknown) => {
		if (!(error instanceof DataError)) throw error;
		log.error({ code: error.code }, error.message);
		process.exitCode = 1;
	});
}
