import { existsSync, readFileSync } from "node:fs";
import type { Config } from "@react-router/dev/config";
import { languages as all } from "./src/features/i18n/languages";

const languages = all.filter(({ code }) =>
	existsSync(new URL(`./src/locales/${code}.json`, import.meta.url)),
);

const trails: { slug: string }[] = JSON.parse(
	readFileSync(
		new URL("./src/generated/trails-index.json", import.meta.url),
		"utf8",
	),
);

export default {
	appDirectory: "src",
	ssr: false,
	prerender: [
		"/",
		"/sitemap.xml",
		"/llms.txt",
		...languages.flatMap(({ code }) => [
			`/${code}/`,
			...trails.map((t) => `/${code}/trail/${t.slug}/`),
		]),
	],
} satisfies Config;
