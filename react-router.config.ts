import { readFileSync } from "node:fs";
import type { Config } from "@react-router/dev/config";
import { publishedLanguages as languages } from "./scripts/published-languages";
import { hubPath, listHubs } from "./src/features/hubs/hubs";
import type { TrailSummary } from "./src/features/trails/trail-schema";

const trails: TrailSummary[] = JSON.parse(
	readFileSync(
		new URL("./src/generated/trails-index.json", import.meta.url),
		"utf8",
	),
);

export default {
	appDirectory: "src",
	ssr: false,
	// Over a thousand pages; one at a time took six and a half minutes.
	prerender: {
		concurrency: 8,
		paths: [
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
	},
} satisfies Config;
