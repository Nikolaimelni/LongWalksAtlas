import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
	isLang,
	type Lang,
	languages,
} from "../src/features/i18n/languages.ts";
import { DataError } from "./data-error.ts";
import { env } from "./env.ts";
import { log } from "./log.ts";
import { readTrails } from "./read-trails.ts";
import {
	characters,
	planContent,
	readEnglish,
	translateContent,
} from "./translate/content.ts";
import { deeplTranslator } from "./translate/deepl.ts";
import { planUi, type Tree, translateUi } from "./translate/ui.ts";
import {
	readTranslations,
	type Translations,
	writeTranslations,
} from "./translations.ts";

const localesDir = join(import.meta.dirname, "../src/locales");

async function main() {
	const { values } = parseArgs({
		options: {
			lang: { type: "string" },
			only: { type: "string" },
			force: { type: "boolean", default: false },
			"dry-run": { type: "boolean", default: false },
		},
	});
	const langs = (
		values.lang?.split(",") ?? languages.map((l) => l.code)
	).filter(
		(code): code is Exclude<Lang, "en"> => isLang(code) && code !== "en",
	);
	const dry = values["dry-run"];
	const translate =
		dry || !env.DEEPL_API_KEY ? null : deeplTranslator(env.DEEPL_API_KEY);
	if (!dry && !translate) {
		throw new DataError(
			"missing-key",
			"Set DEEPL_API_KEY in .env, or run with --dry-run to see what would be sent.",
		);
	}

	const readJson = async (name: string): Promise<Tree> => {
		const path = join(localesDir, name);
		return existsSync(path) ? JSON.parse(await readFile(path, "utf8")) : {};
	};

	if (values.only !== "content") {
		const en = await readJson("en.json");
		for (const lang of langs) {
			const existing = await readJson(`${lang}.json`);
			const jobs = planUi(en, existing, lang);
			const chars = jobs.reduce((n, j) => n + j.text.length, 0);
			if (!translate || jobs.length === 0) {
				log.info({ lang, strings: jobs.length, chars }, "interface");
				continue;
			}
			const { tree, borrowed } = await translateUi(
				en,
				existing,
				lang,
				translate,
			);
			await writeFile(
				join(localesDir, `${lang}.json`),
				`${JSON.stringify(tree, null, "\t")}\n`,
			);
			if (borrowed.length > 0) {
				log.warn({ lang, borrowed }, "plural forms copied from another form");
			}
			log.info({ lang, strings: jobs.length, chars }, "interface translated");
		}
	}

	if (values.only !== "ui") {
		const slugs = (await readTrails()).map((t) => t.slug);
		const written = new Map<Lang, Translations>();
		for (const job of await planContent(slugs, langs, values.force)) {
			const chars = characters(await readEnglish(job.slug));
			if (!translate) {
				log.info({ slug: job.slug, lang: job.lang, chars }, "trail text");
				continue;
			}
			const entries =
				written.get(job.lang) ?? (await readTranslations(job.lang));
			entries[job.slug] = await translateContent(job, translate);
			written.set(job.lang, entries);
			// Written after every trail, so a run cut short keeps what it paid for.
			await writeTranslations(job.lang, entries);
			log.info(
				{ slug: job.slug, lang: job.lang, chars },
				"trail text translated",
			);
		}
	}
}

main().catch((error: unknown) => {
	if (!(error instanceof DataError)) throw error;
	log.error({ code: error.code }, error.message);
	process.exitCode = 1;
});
