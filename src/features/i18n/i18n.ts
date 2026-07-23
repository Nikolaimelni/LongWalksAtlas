import { createInstance, type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import type { Lang } from "./languages";
import type { Messages } from "./messages";

declare module "i18next" {
	interface CustomTypeOptions {
		resources: { translation: Messages };
	}
}

const instances = new Map<Lang, i18n>();

export function getI18n(lang: Lang, messages: Messages): i18n {
	const cached = instances.get(lang);
	if (cached) return cached;

	const instance = createInstance();
	void instance.use(initReactI18next).init({
		lng: lang,
		fallbackLng: false,
		resources: { [lang]: { translation: messages } },
		initAsync: false,
		interpolation: { escapeValue: false },
	});
	instances.set(lang, instance);
	return instance;
}
