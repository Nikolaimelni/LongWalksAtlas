import type en from "~/locales/en.json";
import { defaultLang, type Lang } from "./languages";

export type Messages = typeof en;

const files = import.meta.glob<Messages>("../../locales/*.json", {
	import: "default",
});

type Tree = { [key: string]: string | Tree };

export function mergeMessages(base: Tree, over: Tree): Tree {
	const merged: Tree = { ...base };
	for (const [key, value] of Object.entries(over)) {
		const below = merged[key];
		merged[key] =
			typeof value === "object" && typeof below === "object"
				? mergeMessages(below, value)
				: value;
	}
	return merged;
}

export async function loadMessages(lang: Lang): Promise<Messages> {
	const base = await files[`../../locales/${defaultLang}.json`]?.();
	if (!base) throw new Error("en.json is missing");
	if (lang === defaultLang) return base;
	const over = await files[`../../locales/${lang}.json`]?.();
	// why: the merge keeps every English key, so the result has the English shape.
	return over ? (mergeMessages(base, over) as Messages) : base;
}
