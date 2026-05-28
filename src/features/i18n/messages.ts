import type en from "~/locales/en.json";
import { defaultLang, type Lang } from "./languages";

export type Messages = typeof en;
export type LoadedMessages = Partial<Record<Lang, Messages>>;

const files = import.meta.glob<Messages>("../../locales/*.json", {
	import: "default",
});

export async function loadMessages(lang: Lang): Promise<LoadedMessages> {
	const wanted = lang === defaultLang ? [defaultLang] : [defaultLang, lang];
	const loaded: LoadedMessages = {};
	for (const code of wanted) {
		const messages = await files[`../../locales/${code}.json`]?.();
		if (messages) loaded[code] = messages;
	}
	return loaded;
}
