export const languages = [
	{ code: "en", name: "English", dir: "ltr" },
	{ code: "ru", name: "Русский", dir: "ltr" },
	{ code: "es", name: "Español", dir: "ltr" },
	{ code: "fr", name: "Français", dir: "ltr" },
	{ code: "de", name: "Deutsch", dir: "ltr" },
	{ code: "it", name: "Italiano", dir: "ltr" },
	{ code: "nl", name: "Nederlands", dir: "ltr" },
	{ code: "pl", name: "Polski", dir: "ltr" },
	{ code: "sv", name: "Svenska", dir: "ltr" },
	{ code: "uk", name: "Українська", dir: "ltr" },
	{ code: "pt-PT", name: "Português", dir: "ltr" },
	{ code: "zh-Hans", name: "简体中文", dir: "ltr" },
	{ code: "ja", name: "日本語", dir: "ltr" },
	{ code: "ar", name: "العربية", dir: "rtl" },
	{ code: "tr", name: "Türkçe", dir: "ltr" },
] as const;

export type Lang = (typeof languages)[number]["code"];

export const defaultLang: Lang = "en";

export function isLang(value: string | undefined): value is Lang {
	return languages.some((l) => l.code === value);
}

export function langDir(lang: Lang): "ltr" | "rtl" {
	return languages.find((l) => l.code === lang)?.dir ?? "ltr";
}

function likelySubtags(tag: string): Intl.Locale | undefined {
	try {
		return new Intl.Locale(tag).maximize();
	} catch {
		return undefined;
	}
}

export function pickLang(
	preferred: readonly string[],
	available: readonly { code: Lang }[] = languages,
): Lang {
	for (const tag of preferred) {
		const wanted = likelySubtags(tag);
		if (!wanted) continue;
		const match = available.find((l) => {
			const ours = new Intl.Locale(l.code).maximize();
			return ours.language === wanted.language && ours.script === wanted.script;
		});
		if (match) return match.code;
	}
	return defaultLang;
}

export function swapLang(pathname: string, lang: Lang): string {
	const [, , ...rest] = pathname.split("/");
	return `/${[lang, ...rest].join("/")}`;
}

// Open Graph wants language_TERRITORY; the likely region is as good a guess as any.
export function ogLocale(lang: Lang): string {
	const { language, region } = new Intl.Locale(lang).maximize();
	return `${language}_${region}`;
}
