import { isLang, type Lang } from "./languages";

const key = "lang";

export function readStoredLang(): Lang | undefined {
	try {
		const value = localStorage.getItem(key) ?? undefined;
		return isLang(value) ? value : undefined;
	} catch {
		return undefined;
	}
}

export function storeLang(lang: Lang): void {
	try {
		localStorage.setItem(key, lang);
	} catch {
		// storage blocked: private mode or cookies off
	}
}
