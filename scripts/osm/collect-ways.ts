import type { Position } from "geojson";
import type { OverpassRelation } from "./overpass.ts";

export type Way = { id: number; coords: Position[] };

export const sideRoles = new Set([
	"alternative",
	"excursion",
	"approach",
	"connection",
	"link",
	"spur",
]);

export function collectWays(
	rootId: number,
	relations: readonly OverpassRelation[],
): { ways: Way[]; missingRelations: number[] } {
	const byId = new Map(relations.map((r) => [r.id, r]));
	const visited = new Set<number>();
	const seenWays = new Set<number>();
	const ways: Way[] = [];
	const missingRelations: number[] = [];

	function visit(id: number) {
		if (visited.has(id)) return;
		visited.add(id);
		const relation = byId.get(id);
		if (!relation) {
			missingRelations.push(id);
			return;
		}
		for (const m of relation.members) {
			if (sideRoles.has(m.role)) continue;
			if (m.type === "relation") {
				visit(m.ref);
			} else if (m.type === "way" && m.geometry && !seenWays.has(m.ref)) {
				seenWays.add(m.ref);
				const coords = m.geometry
					.filter((p) => p !== null)
					.map((p) => [p.lon, p.lat]);
				if (coords.length >= 2) ways.push({ id: m.ref, coords });
			}
		}
	}

	visit(rootId);
	return { ways, missingRelations };
}
