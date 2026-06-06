import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { DataError } from "../data-error.ts";
import { env } from "../env.ts";
import { log } from "../log.ts";

const point = z.object({ lat: z.number(), lon: z.number() });

const member = z.object({
	type: z.enum(["node", "way", "relation"]),
	ref: z.int(),
	role: z.string(),
	geometry: z.array(point.nullable()).optional(),
});

const relation = z.object({
	type: z.literal("relation"),
	id: z.int(),
	tags: z.record(z.string(), z.string()).optional(),
	members: z.array(member),
});

const responseSchema = z.object({
	remark: z.string().optional(),
	elements: z.array(relation),
});

export type OverpassRelation = z.infer<typeof relation>;

const cacheDir = join(import.meta.dirname, "../../data/cache/osm");
const userAgent = "long-walks-atlas/0.1 (+https://longwalksatlas.com)";
const retryable = new Set([429, 500, 502, 503, 504]);
const maxAttempts = 4;

function relationTreeQuery(id: number): string {
	return `[out:json][timeout:900];relation(${id});(._;>>;);rel._;out geom;`;
}

export async function loadRelationTree(
	id: number,
	{ refresh }: { refresh: boolean },
): Promise<OverpassRelation[]> {
	const file = join(cacheDir, `${id}.json`);
	if (!refresh && existsSync(file)) {
		return responseSchema.parse(JSON.parse(await readFile(file, "utf8")))
			.elements;
	}
	const response = await query(relationTreeQuery(id));
	await mkdir(cacheDir, { recursive: true });
	await writeFile(file, JSON.stringify(response));
	return response.elements;
}

async function query(ql: string): Promise<z.infer<typeof responseSchema>> {
	for (let attempt = 1; ; attempt++) {
		const url = env.OVERPASS_URLS[(attempt - 1) % env.OVERPASS_URLS.length];
		if (!url) throw new DataError("overpass-failed", "no Overpass URL set");

		const response = await fetch(url, {
			method: "POST",
			headers: { "User-Agent": userAgent },
			body: new URLSearchParams({ data: ql }),
			signal: AbortSignal.timeout(16 * 60_000),
		});

		if (response.ok) {
			const parsed = responseSchema.safeParse(await response.json());
			if (!parsed.success) {
				throw new DataError(
					"overpass-bad-response",
					`${url}: ${z.prettifyError(parsed.error)}`,
				);
			}
			if (parsed.data.remark) {
				throw new DataError("overpass-failed", `${url}: ${parsed.data.remark}`);
			}
			return parsed.data;
		}

		if (!retryable.has(response.status) || attempt === maxAttempts) {
			throw new DataError(
				"overpass-failed",
				`${url} answered ${response.status} on attempt ${attempt}`,
			);
		}
		const waitMs = 10_000 * 2 ** (attempt - 1);
		log.warn(
			{ url, status: response.status, attempt, waitMs },
			"Overpass busy, retrying",
		);
		await sleep(waitMs);
	}
}
