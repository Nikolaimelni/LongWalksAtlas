import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import {
	type TrailFile,
	type TrailSummary,
	trailFileSchema,
} from "../src/features/trails/trail-schema.ts";
import { buildTrail, type TrailFeature } from "./build-trail.ts";
import { DataError } from "./data-error.ts";
import { mergeLines } from "./geo/merge-lines.ts";
import { log } from "./log.ts";
import { collectWays } from "./osm/collect-ways.ts";
import { loadRelationTree } from "./osm/overpass.ts";

const root = join(import.meta.dirname, "..");
const trailsDir = join(root, "data/trails");
const publicDir = join(root, "public/data");
const indexFile = join(root, "src/generated/trails-index.json");

const lengthWarnRatio = 0.15;

async function readTrails(): Promise<TrailFile[]> {
	const files = (await readdir(trailsDir))
		.filter((f) => f.endsWith(".json"))
		.sort();
	const problems: string[] = [];
	const trails: TrailFile[] = [];

	for (const file of files) {
		const text = await readFile(join(trailsDir, file), "utf8");
		let json: unknown;
		try {
			json = JSON.parse(text);
		} catch (error) {
			problems.push(`${file}: not valid JSON (${String(error)})`);
			continue;
		}
		const parsed = trailFileSchema.safeParse(json);
		if (!parsed.success) {
			problems.push(`${file}\n${z.prettifyError(parsed.error)}`);
		} else if (parsed.data.slug !== basename(file, ".json")) {
			problems.push(
				`${file}: slug "${parsed.data.slug}" differs from the file name`,
			);
		} else {
			trails.push(parsed.data);
		}
	}

	if (problems.length > 0) {
		throw new DataError("invalid-trail", problems.join("\n\n"));
	}
	return trails;
}

async function main() {
	const { values } = parseArgs({
		options: { refresh: { type: "boolean", default: false } },
	});
	const trails = await readTrails();
	const summaries: TrailSummary[] = [];
	const atlas: TrailFeature[] = [];
	await mkdir(join(publicDir, "trails"), { recursive: true });

	for (const trail of trails) {
		const segments = [];
		for (const id of trail.geometry.relationIds) {
			const relations = await loadRelationTree(id, { refresh: values.refresh });
			const { ways, missingRelations } = collectWays(id, relations);
			if (missingRelations.length > 0) {
				log.warn(
					{ slug: trail.slug, missingRelations },
					"child relations missing from the Overpass response",
				);
			}
			segments.push(...ways.map((w) => w.coords));
		}

		const lines = mergeLines(segments);
		if (lines.length === 0) {
			throw new DataError(
				"empty-geometry",
				`${trail.slug}: no ways in OSM relations ${trail.geometry.relationIds.join(", ")}`,
			);
		}

		const built = buildTrail(trail, lines);
		summaries.push(built.summary);
		atlas.push(built.atlas);
		await writeFile(
			join(publicDir, "trails", `${trail.slug}.geojson`),
			JSON.stringify(built.detail),
		);

		const osmKm = Math.round(built.osmKm);
		const gap = trail.lengthKm ? osmKm / trail.lengthKm - 1 : null;
		const report = {
			slug: trail.slug,
			osmKm,
			officialKm: trail.lengthKm,
			gap: gap === null ? null : `${Math.round(gap * 100)}%`,
			ways: segments.length,
			pieces: lines.length,
		};
		if (gap !== null && Math.abs(gap) > lengthWarnRatio) {
			log.warn(report, "mapped length is far from the official one");
		} else {
			log.info(report, "built");
		}
	}

	summaries.sort((a, b) => a.name.original.localeCompare(b.name.original));
	await writeFile(
		join(publicDir, "trails.geojson"),
		JSON.stringify({ type: "FeatureCollection", features: atlas }),
	);
	await mkdir(join(root, "src/generated"), { recursive: true });
	await writeFile(indexFile, `${JSON.stringify(summaries, null, "\t")}\n`);
	log.info({ trails: summaries.length }, "wrote atlas, trail files and index");
}

main().catch((error: unknown) => {
	if (!(error instanceof DataError)) throw error;
	log.error({ code: error.code }, error.message);
	process.exitCode = 1;
});
