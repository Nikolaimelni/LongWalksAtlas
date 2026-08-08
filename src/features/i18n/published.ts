import { languages } from "./languages";

const files = import.meta.glob("../../locales/*.json");

export const publishedLanguages = languages.filter(
	({ code }) => `../../locales/${code}.json` in files,
);
