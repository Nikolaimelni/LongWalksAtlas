import { existsSync, readFileSync } from "node:fs";
import type { Config } from "@react-router/dev/config";
import { hubPath, listHubs } from "./src/features/hubs/hubs";
import { languages as all } from "./src/features/i18n/languages";
import type { TrailSummary } from "./src/features/trails/trail-schema";

const languages = all.filter(({ code }) =>
	existsSync(new URL(`./src/locales/${code}.json`, import.meta.url)),
);

const trails: TrailSummary[] = JSON.parse(
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
			`/${code}/og-card/`,
			...trails.map((t) => `/${code}/og-card/trail/${t.slug}/`),
			...trails.map((t) => `/${code}/trail/${t.slug}/`),
			...listHubs(trails).map((hub) => `/${code}/${hubPath(hub)}`),
		]),
	],
} satisfies Config;
