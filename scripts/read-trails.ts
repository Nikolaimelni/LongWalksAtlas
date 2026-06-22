import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { z } from "zod";
import {
	type TrailFile,
	trailFileSchema,
} from "../src/features/trails/trail-schema.ts";
import { DataError } from "./data-error.ts";

const trailsDir = join(import.meta.dirname, "../data/trails");

export async function readTrails(): Promise<TrailFile[]> {
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
