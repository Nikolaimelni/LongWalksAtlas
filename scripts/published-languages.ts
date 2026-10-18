import { existsSync } from "node:fs";
import { join } from "node:path";
import { languages } from "../src/features/i18n/languages.ts";

// A language is on the site once src/locales/<code>.json exists. The bundle applies
// the same rule through import.meta.glob (src/features/i18n/published.ts); this is the
// copy for code that runs in Node: the React Router config and the build scripts.
export const publishedLanguages = languages.filter(({ code }) =>
	existsSync(join(import.meta.dirname, "../src/locales", `${code}.json`)),
);
