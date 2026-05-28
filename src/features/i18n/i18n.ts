import { createInstance, type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLang, type Lang } from "./languages";
import type { LoadedMessages, Messages } from "./messages";

declare module "i18next" {
	interface CustomTypeOptions {
		resources: { translation: Messages };
	}
}

const instances = new Map<Lang, i18n>();

export function getI18n(lang: Lang, messages: LoadedMessages): i18n {
	const cached = instances.get(lang);
	if (cached) return cached;

	const instance = createInstance();
	const resources = Object.fromEntries(
		Object.entries(messages).map(([code, translation]) => [
			code,
			{ translation },
		]),
	);
	void instance.use(initReactI18next).init({
		lng: lang,
		fallbackLng: defaultLang,
		resources,
		initAsync: false,
		interpolation: { escapeValue: false },
	});
	instances.set(lang, instance);
	return instance;
}
