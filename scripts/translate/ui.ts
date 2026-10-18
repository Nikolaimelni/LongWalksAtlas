import type { Lang } from "../../src/features/i18n/languages.ts";
import {
	pluralSample,
	protect,
	restore,
	withoutSample,
	withSample,
} from "./placeholders.ts";

export type Tree = { [key: string]: string | Tree };

export type Translator = (
	texts: string[],
	lang: Exclude<Lang, "en">,
	kind: "plain" | "html",
) => Promise<string[]>;

type Job = {
	path: string[];
	key: string;
	text: string;
	sample: number | null;
};

const pluralSuffix = /_(zero|one|two|few|many|other)$/;

// The site name is a brand: every language shows it in English.
const keepEnglish = new Set(["app.name"]);

export function planUi(
	en: Tree,
	existing: Tree,
	lang: Exclude<Lang, "en">,
	path: string[] = [],
): Job[] {
	const jobs: Job[] = [];
	const categories = new Intl.PluralRules(lang).resolvedOptions()
		.pluralCategories;
	const done = new Set<string>();

	for (const [key, value] of Object.entries(en)) {
		const have = existing[key];
		if (typeof value === "object") {
			jobs.push(
				...planUi(value, typeof have === "object" ? have : {}, lang, [
					...path,
					key,
				]),
			);
			continue;
		}
		const base = key.replace(pluralSuffix, "");
		if (base === key) {
			if (keepEnglish.has([...path, key].join("."))) continue;
			if (typeof have !== "string") {
				jobs.push({ path, key, text: protect(value), sample: null });
			}
			continue;
		}
		if (done.has(base)) continue;
		done.add(base);
		const source = en[`${base}_other`];
		if (typeof source !== "string") continue;
		for (const category of categories) {
			const target = `${base}_${category}`;
			if (typeof existing[target] === "string") continue;
			const sample = pluralSample(lang, category);
			if (sample === null) continue;
			const own = en[target];
			const text =
				typeof own === "string" && category !== "other" ? own : source;
			jobs.push({
				path,
				key: target,
				text: protect(withSample(text, sample)),
				sample,
			});
		}
	}
	return jobs;
}

export async function translateUi(
	en: Tree,
	existing: Tree,
	lang: Exclude<Lang, "en">,
	translate: Translator,
): Promise<{ tree: Tree; borrowed: string[] }> {
	const jobs = planUi(en, existing, lang);
	const results = jobs.length
		? await translate(
				jobs.map((j) => j.text),
				lang,
				"plain",
			)
		: [];

	const found = new Map<string, string | null>();
	jobs.forEach((job, i) => {
		const text = restore(results[i] ?? "");
		found.set(
			[...job.path, job.key].join("."),
			job.sample === null ? text : withoutSample(text, job.sample),
		);
	});

	const borrowed: string[] = [];
	const categories = new Intl.PluralRules(lang).resolvedOptions()
		.pluralCategories;

	function build(source: Tree, have: Tree, path: string[]): Tree {
		const out: Tree = {};
		const seen = new Set<string>();
		for (const [key, value] of Object.entries(source)) {
			const at = [...path, key];
			if (typeof value === "object") {
				const sub = have[key];
				out[key] = build(value, typeof sub === "object" ? sub : {}, at);
				continue;
			}
			const base = key.replace(pluralSuffix, "");
			if (base === key) {
				const own = have[key];
				out[key] = keepEnglish.has(at.join("."))
					? value
					: typeof own === "string"
						? own
						: (found.get(at.join(".")) ?? value);
				continue;
			}
			if (seen.has(base)) continue;
			seen.add(base);
			const other = (cat: string) => {
				const own = have[`${base}_${cat}`];
				return typeof own === "string"
					? own
					: found.get([...path, `${base}_${cat}`].join("."));
			};
			for (const category of categories) {
				const name = `${base}_${category}`;
				const text =
					other(category) ??
					(pluralSample(lang, category) === null
						? (other("few") ?? other("many") ?? other("one"))
						: undefined);
				if (text) {
					out[name] = text;
				} else {
					borrowed.push([...path, name].join("."));
					out[name] = other("other") ?? String(source[`${base}_other`] ?? "");
				}
			}
		}
		return out;
	}

	return { tree: build(en, existing, []), borrowed };
}
