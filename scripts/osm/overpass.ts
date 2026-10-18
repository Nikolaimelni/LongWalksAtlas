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

export const relationTreeSchema = z.object({
	remark: z.string().optional(),
	elements: z.array(relation),
});

export type OverpassRelation = z.infer<typeof relation>;

export const userAgent = "long-walks-atlas/0.1 (+https://longwalksatlas.com)";

const retryable = new Set([429, 500, 502, 503, 504]);
const maxAttempts = 4;

function relationTreeQuery(id: number): string {
	return `[out:json][timeout:900];relation(${id});(._;>>;);rel._;out geom;`;
}

export async function fetchFromOverpass(
	id: number,
): Promise<OverpassRelation[]> {
	const ql = relationTreeQuery(id);
	for (let attempt = 1; ; attempt++) {
		const url = env.OVERPASS_URLS[(attempt - 1) % env.OVERPASS_URLS.length];
		if (!url) throw new DataError("overpass-failed", "no Overpass URL set");

		// A refused connection or a timeout rejects instead of answering; it is treated
		// like a busy server, so the next endpoint and then the OSM API still get a turn.
		const response = await fetch(
			`${url}?${new URLSearchParams({ data: ql })}`,
			{
				headers: { "User-Agent": userAgent },
				signal: AbortSignal.timeout(16 * 60_000),
			},
		).catch((error: unknown) => String(error));

		if (typeof response !== "string" && response.ok) {
			const parsed = relationTreeSchema.safeParse(
				await response.json().catch(() => null),
			);
			if (!parsed.success) {
				throw new DataError(
					"overpass-bad-response",
					`${url}: ${z.prettifyError(parsed.error)}`,
				);
			}
			if (parsed.data.remark) {
				throw new DataError("overpass-failed", `${url}: ${parsed.data.remark}`);
			}
			return parsed.data.elements;
		}

		const reason =
			typeof response === "string" ? response : `answered ${response.status}`;
		const busy = typeof response === "string" || retryable.has(response.status);
		if (!busy || attempt === maxAttempts) {
			throw new DataError(
				"overpass-failed",
				`${url} ${reason} on attempt ${attempt}`,
			);
		}
		const waitMs = 10_000 * 2 ** (attempt - 1);
		log.warn({ url, reason, attempt, waitMs }, "Overpass busy, retrying");
		await sleep(waitMs);
	}
}
