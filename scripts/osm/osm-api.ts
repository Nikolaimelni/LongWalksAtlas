import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { DataError } from "../data-error.ts";
import { log } from "../log.ts";
import { sideRoles } from "./collect-ways.ts";
import { type OverpassRelation, userAgent } from "./overpass.ts";

const base = "https://api.openstreetmap.org/api/0.6";

const element = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("node"),
		id: z.int(),
		lat: z.number(),
		lon: z.number(),
	}),
	z.object({ type: z.literal("way"), id: z.int(), nodes: z.array(z.int()) }),
	z.object({
		type: z.literal("relation"),
		id: z.int(),
		tags: z.record(z.string(), z.string()).optional(),
		members: z.array(
			z.object({
				type: z.enum(["node", "way", "relation"]),
				ref: z.int(),
				role: z.string(),
			}),
		),
	}),
]);

const fullSchema = z.object({ elements: z.array(element) });

export async function fetchFromOsmApi(
	rootId: number,
): Promise<OverpassRelation[]> {
	const done = new Map<number, OverpassRelation>();
	const queue = [rootId];

	while (queue.length > 0) {
		const id = queue.shift();
		if (id === undefined || done.has(id)) continue;
		const { elements } = await getFull(id);

		const nodes = new Map<number, { lat: number; lon: number }>();
		const ways = new Map<number, number[]>();
		let self:
			| Extract<z.infer<typeof element>, { type: "relation" }>
			| undefined;
		for (const e of elements) {
			if (e.type === "node") nodes.set(e.id, { lat: e.lat, lon: e.lon });
			else if (e.type === "way") ways.set(e.id, e.nodes);
			else if (e.id === id) self = e;
		}
		if (!self) {
			throw new DataError(
				"osm-api-failed",
				`relation ${id} missing from its own /full response`,
			);
		}

		done.set(id, {
			type: "relation",
			id,
			...(self.tags ? { tags: self.tags } : {}),
			members: self.members.map((m) =>
				m.type === "way"
					? {
							...m,
							geometry: (ways.get(m.ref) ?? []).map(
								(n) => nodes.get(n) ?? null,
							),
						}
					: m,
			),
		});
		for (const m of self.members) {
			if (m.type === "relation" && !sideRoles.has(m.role)) queue.push(m.ref);
		}
	}
	return [...done.values()];
}

async function getFull(id: number): Promise<z.infer<typeof fullSchema>> {
	const url = `${base}/relation/${id}/full.json`;
	for (let attempt = 1; ; attempt++) {
		// A dropped connection or a timeout rejects; it is retried like a 5xx.
		const response = await fetch(url, {
			headers: { "User-Agent": userAgent },
			signal: AbortSignal.timeout(5 * 60_000),
		}).catch((error: unknown) => String(error));
		if (typeof response !== "string" && response.ok) {
			const parsed = fullSchema.safeParse(
				await response.json().catch(() => null),
			);
			if (!parsed.success) {
				throw new DataError(
					"osm-api-failed",
					`${url}: ${z.prettifyError(parsed.error)}`,
				);
			}
			return parsed.data;
		}
		const reason =
			typeof response === "string" ? response : `answered ${response.status}`;
		if (
			typeof response !== "string" &&
			response.status < 500 &&
			response.status !== 429
		) {
			throw new DataError("osm-api-failed", `${url} ${reason}`);
		}
		if (attempt === 3) {
			throw new DataError("osm-api-failed", `${url} ${reason}, three times`);
		}
		log.warn({ url, reason, attempt }, "OSM API busy, retrying");
		await sleep(5_000 * attempt);
	}
}
