import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { Lang } from "../src/features/i18n/languages.ts";
import { contentFrontmatterSchema } from "../src/features/trails/content-schema.ts";
import { DataError } from "./data-error.ts";

// Machine translations of trail texts, one file per language rather than one per trail
// per language. A text someone has read and corrected moves out of here into
// data/content/<slug>/<lang>.md, which always wins.
const dir = join(import.meta.dirname, "../data/translations");

const translationSchema = contentFrontmatterSchema
	.pick({ title: true, summary: true })
	.extend({ html: z.string() });

export type Translation = z.infer<typeof translationSchema>;
export type Translations = Record<string, Translation>;

export async function readTranslations(lang: Lang): Promise<Translations> {
	const file = join(dir, `${lang}.json`);
	if (!existsSync(file)) return {};
	const parsed = z
		.record(z.string(), translationSchema)
		.safeParse(JSON.parse(await readFile(file, "utf8")));
	if (!parsed.success) {
		throw new DataError(
			"invalid-content",
			`data/translations/${lang}.json\n${z.prettifyError(parsed.error)}`,
		);
	}
	return parsed.data;
}

export async function writeTranslations(
	lang: Lang,
	entries: Translations,
): Promise<void> {
	const sorted = Object.fromEntries(
		Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
	);
	await mkdir(dir, { recursive: true });
	await writeFile(
		join(dir, `${lang}.json`),
		`${JSON.stringify(sorted, null, "\t")}\n`,
	);
}
