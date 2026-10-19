import { z } from "zod";
import type { Lang } from "../../src/features/i18n/languages.ts";
import { DataError } from "../data-error.ts";
import { userAgent } from "../osm/overpass.ts";
import type { Translator } from "./ui.ts";

const targets: Record<Exclude<Lang, "en">, string> = {
	ru: "RU",
	es: "ES",
	fr: "FR",
	de: "DE",
	it: "IT",
	nl: "NL",
	pl: "PL",
	sv: "SV",
	uk: "UK",
	"pt-PT": "PT-PT",
	ja: "JA",
	ko: "KO",
	cs: "CS",
	tr: "TR",
};

const responseSchema = z.object({
	translations: z.array(z.object({ text: z.string() })),
});

// The free plan answers 429 when requests come too fast; it clears in seconds.
async function withRetry(send: () => Promise<Response>): Promise<Response> {
	for (let attempt = 1; ; attempt++) {
		const response = await send();
		if (response.status !== 429 || attempt === 5) return response;
		await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
	}
}

export function deeplTranslator(key: string): Translator {
	const host = key.endsWith(":fx")
		? "https://api-free.deepl.com"
		: "https://api.deepl.com";
	return async (texts, lang, kind) => {
		const out: string[] = [];
		for (let i = 0; i < texts.length; i += 50) {
			const batch = texts.slice(i, i + 50);
			const response = await withRetry(() =>
				fetch(`${host}/v2/translate`, {
					method: "POST",
					headers: {
						Authorization: `DeepL-Auth-Key ${key}`,
						"Content-Type": "application/json",
						"User-Agent": userAgent,
					},
					body: JSON.stringify({
						text: batch,
						source_lang: "EN",
						target_lang: targets[lang],
						tag_handling: kind === "html" ? "html" : "xml",
						ignore_tags: ["ph"],
					}),
				}),
			);
			if (!response.ok) {
				throw new DataError(
					"translate-failed",
					`DeepL answered ${response.status}: ${(await response.text()).slice(0, 200)}`,
				);
			}
			const parsed = responseSchema.safeParse(await response.json());
			if (!parsed.success || parsed.data.translations.length !== batch.length) {
				throw new DataError(
					"translate-failed",
					"DeepL sent an unexpected response",
				);
			}
			out.push(...parsed.data.translations.map((t) => t.text));
		}
		return out;
	};
}
