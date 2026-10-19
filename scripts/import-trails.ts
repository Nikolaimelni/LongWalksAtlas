import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import {
	type TrailFile,
	trailFileSchema,
} from "../src/features/trails/trail-schema.ts";
import { DataError } from "./data-error.ts";
import { log } from "./log.ts";

// Turns a collection run into trail files and English texts. The run, its brief and
// the reviewer's corrections live in data/import/, which is not committed; what comes
// out of here is.

const root = join(import.meta.dirname, "..");
const importDir = join(root, "data/import");

const place = z.object({
	name: z.string(),
	coords: z.tuple([z.number(), z.number()]),
});

const collectedSchema = z.object({
	trails: z.array(
		z.object({
			slug: z.string(),
			nameOriginal: z.string(),
			nameEn: z.string(),
			type: z.string(),
			region: z.string(),
			countries: z.array(z.string()),
			start: place,
			end: place,
			lengthKm: z.number().nullable(),
			days: z.object({ min: z.number(), max: z.number() }).nullable(),
			bestSeason: z.array(z.string()).nullable(),
			badges: z.array(z.string()),
			officialUrl: z.string(),
			sources: z.array(z.string()),
			osm: z.object({ relationIds: z.array(z.number()) }),
			summaryEn: z.string(),
			storyEn: z.string(),
		}),
	),
});

const fixesSchema = z.record(
	z.string(),
	z.object({
		relationIds: z.array(z.number()).optional(),
		start: place.optional(),
		end: place.optional(),
		photo: z.object({ commons: z.string() }).optional(),
		wikidata: z.string().optional(),
	}),
);

type Collected = z.infer<typeof collectedSchema>["trails"][number];
type Fix = z.infer<typeof fixesSchema>[string];

// "Camino Francés (French Way)" reads as a title without the gloss in brackets.
function titleOf(trail: Collected): string {
	return trail.nameEn.replace(/\s*\([^)]*\)\s*$/, "");
}

function toTrailFile(trail: Collected, fix: Fix): unknown {
	return {
		slug: trail.slug,
		name: { original: trail.nameOriginal },
		type: trail.type,
		region: trail.region,
		start: fix.start ?? trail.start,
		end: fix.end ?? trail.end,
		countries: trail.countries,
		lengthKm: trail.lengthKm,
		days: trail.days,
		bestSeason: trail.bestSeason ?? [],
		badges: trail.badges,
		officialUrl: trail.officialUrl,
		sources: trail.sources,
		photo: fix.photo ? { commons: fix.photo.commons } : null,
		wikidata: fix.wikidata ?? null,
		geometry: {
			source: "osm",
			relationIds: fix.relationIds ?? trail.osm.relationIds,
		},
	};
}

function toMarkdown(trail: Collected): string {
	return `---
title: ${JSON.stringify(titleOf(trail))}
summary: ${JSON.stringify(trail.summaryEn)}
status: machine
---

${trail.storyEn.trim()}
`;
}

async function readJson<T>(file: string, schema: z.ZodType<T>): Promise<T> {
	const parsed = schema.safeParse(JSON.parse(await readFile(file, "utf8")));
	if (!parsed.success) {
		throw new DataError(
			"invalid-trail",
			`${file}\n${z.prettifyError(parsed.error)}`,
		);
	}
	return parsed.data;
}

async function main() {
	// Each collection run keeps its own pair of files, e.g. --run new-trails reads
	// new-trails.json and new-trails-fixes.json.
	const { values } = parseArgs({
		options: {
			skip: { type: "string", default: "" },
			run: { type: "string" },
		},
	});
	const skip = new Set(values.skip.split(",").filter(Boolean));

	const { trails } = await readJson(
		join(importDir, values.run ? `${values.run}.json` : "trails.json"),
		collectedSchema,
	);
	const fixesFile = join(
		importDir,
		values.run ? `${values.run}-fixes.json` : "fixes.json",
	);
	const fixes = existsSync(fixesFile)
		? await readJson(fixesFile, fixesSchema)
		: {};

	const ready: { trail: Collected; file: TrailFile }[] = [];
	const problems: string[] = [];
	for (const trail of trails) {
		if (skip.has(trail.slug)) continue;
		if (existsSync(join(root, "data/trails", `${trail.slug}.json`))) {
			log.info({ slug: trail.slug }, "already in data/trails, left as it is");
			continue;
		}
		const parsed = trailFileSchema.safeParse(
			toTrailFile(trail, fixes[trail.slug] ?? {}),
		);
		if (parsed.success) ready.push({ trail, file: parsed.data });
		else problems.push(`${trail.slug}\n${z.prettifyError(parsed.error)}`);
	}

	// Nothing is written while any trail fails, so a rerun after a fix starts clean.
	if (problems.length > 0) {
		throw new DataError("invalid-trail", problems.join("\n\n"));
	}

	for (const { trail, file } of ready) {
		await writeFile(
			join(root, "data/trails", `${trail.slug}.json`),
			`${JSON.stringify(file, null, "\t")}\n`,
		);
		const contentDir = join(root, "data/content", trail.slug);
		await mkdir(contentDir, { recursive: true });
		await writeFile(join(contentDir, "en.md"), toMarkdown(trail));
	}
	log.info({ written: ready.length }, "imported");
}

main().catch((error: unknown) => {
	if (!(error instanceof DataError)) throw error;
	log.error({ code: error.code }, error.message);
	process.exitCode = 1;
});
