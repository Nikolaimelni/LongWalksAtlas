import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { Position } from "geojson";
import type {
	TrailFile,
	TrailSummary,
} from "../src/features/trails/trail-schema.ts";
import { buildTrail, type TrailFeature } from "./build-trail.ts";
import { DataError } from "./data-error.ts";
import { haversineKm, mainLine } from "./geo/main-line.ts";
import { mergeLines } from "./geo/merge-lines.ts";
import { findNeighbours } from "./geo/neighbours.ts";
import { log } from "./log.ts";
import { collectWays } from "./osm/collect-ways.ts";
import { loadRelationTree } from "./osm/relation-tree.ts";
import { readTrails } from "./read-trails.ts";

const root = join(import.meta.dirname, "..");
const publicDir = join(root, "public/data");
const indexFile = join(root, "src/generated/trails-index.json");

const lengthWarnRatio = 0.15;

function traceLines(trail: TrailFile, segments: Position[][]) {
	const loop = haversineKm(trail.start.coords, trail.end.coords) < 1;
	const wanted = !loop && trail.geometry.mode !== "all-ways";
	const line = wanted
		? mainLine(segments, trail.start.coords, trail.end.coords)
		: null;
	if (wanted && !line) {
		log.warn(
			{ slug: trail.slug },
			"no path between the official start and end, drawing every way",
		);
	}
	return line
		? { lines: [line], mode: "main-line" as const }
		: { lines: mergeLines(segments), mode: "all-ways" as const };
}

async function buildOne(trail: TrailFile, refresh: boolean) {
	const segments = [];
	for (const id of trail.geometry.relationIds) {
		const relations = await loadRelationTree(id, { refresh });
		const { ways, missingRelations } = collectWays(id, relations);
		if (missingRelations.length > 0) {
			log.warn(
				{ slug: trail.slug, missingRelations },
				"child relations missing from the Overpass response",
			);
		}
		segments.push(...ways.map((w) => w.coords));
	}

	const { lines, mode } = traceLines(trail, segments);
	if (lines.length === 0) {
		throw new DataError(
			"empty-geometry",
			`${trail.slug}: no ways in OSM relations ${trail.geometry.relationIds.join(", ")}`,
		);
	}

	const built = buildTrail(trail, lines);
	const osmKm = Math.round(built.osmKm);
	const gap = trail.lengthKm ? osmKm / trail.lengthKm - 1 : null;
	const report = {
		slug: trail.slug,
		osmKm,
		officialKm: trail.lengthKm,
		gap: gap === null ? null : `${Math.round(gap * 100)}%`,
		ways: segments.length,
		mode,
		pieces: lines.length,
	};
	if (gap !== null && Math.abs(gap) > lengthWarnRatio) {
		log.warn(report, "mapped length is far from the official one");
	} else {
		log.info(report, "built");
	}
	return built;
}

async function main() {
	const { values } = parseArgs({
		options: { refresh: { type: "boolean", default: false } },
	});
	const trails = await readTrails();
	const summaries: TrailSummary[] = [];
	const atlas: TrailFeature[] = [];
	const details: TrailFeature[] = [];
	const failed: string[] = [];
	await mkdir(join(publicDir, "trails"), { recursive: true });

	for (const trail of trails) {
		try {
			const built = await buildOne(trail, values.refresh);
			summaries.push(built.summary);
			atlas.push(built.atlas);
			details.push(built.detail);
			await writeFile(
				join(publicDir, "trails", `${trail.slug}.geojson`),
				JSON.stringify(built.detail),
			);
		} catch (error) {
			if (!(error instanceof DataError)) throw error;
			log.error({ slug: trail.slug, code: error.code }, error.message);
			failed.push(trail.slug);
		}
	}

	const neighbours = findNeighbours(
		summaries.map((s, i) => ({
			slug: s.slug,
			bbox: s.bbox,
			lines: details[i]?.geometry.coordinates ?? [],
		})),
	);
	for (const summary of summaries) {
		Object.assign(summary, neighbours.get(summary.slug));
	}

	summaries.sort((a, b) => a.name.original.localeCompare(b.name.original));
	await writeFile(
		join(publicDir, "trails.geojson"),
		JSON.stringify({ type: "FeatureCollection", features: atlas }),
	);
	await mkdir(join(root, "src/generated"), { recursive: true });
	await writeFile(indexFile, `${JSON.stringify(summaries, null, "\t")}\n`);
	log.info({ trails: summaries.length }, "wrote atlas, trail files and index");

	if (failed.length > 0) {
		throw new DataError("incomplete-build", `not built: ${failed.join(", ")}`);
	}
}

main().catch((error: unknown) => {
	if (!(error instanceof DataError)) throw error;
	log.error({ code: error.code }, error.message);
	process.exitCode = 1;
});
