import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DataError } from "../data-error.ts";
import { log } from "../log.ts";
import { fetchFromOsmApi } from "./osm-api.ts";
import {
	fetchFromOverpass,
	type OverpassRelation,
	relationTreeSchema,
} from "./overpass.ts";

const cacheDir = join(import.meta.dirname, "../../data/cache/osm");

export async function loadRelationTree(
	id: number,
	{ refresh }: { refresh: boolean },
): Promise<OverpassRelation[]> {
	const file = join(cacheDir, `${id}.json`);
	if (!refresh && existsSync(file)) {
		return relationTreeSchema.parse(JSON.parse(await readFile(file, "utf8")))
			.elements;
	}

	let elements: OverpassRelation[];
	try {
		elements = await fetchFromOverpass(id);
	} catch (error) {
		if (!(error instanceof DataError) || error.code !== "overpass-failed") {
			throw error;
		}
		log.warn(
			{ relation: id, reason: error.message },
			"Overpass unavailable, falling back to the OSM API",
		);
		elements = await fetchFromOsmApi(id);
	}

	await mkdir(cacheDir, { recursive: true });
	await writeFile(file, JSON.stringify({ elements }));
	return elements;
}
