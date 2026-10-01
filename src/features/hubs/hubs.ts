import {
	type TrailSummary,
	type TrailType,
	trailTypes,
} from "../trails/trail-schema";

// A country or type page with a single trail on it would only repeat that trail's own
// page, so a page appears once a second trail joins it.
export const minTrailsPerHub = 2;

export type Hub =
	| { kind: "country"; code: string }
	| { kind: "type"; type: TrailType };

type HubTrail = Pick<TrailSummary, "type" | "countries">;

export function hubPath(hub: Hub): string {
	return hub.kind === "country"
		? `country/${hub.code.toLowerCase()}/`
		: `type/${hub.type}/`;
}

export function trailsIn<T extends HubTrail>(
	hub: Hub,
	trails: readonly T[],
): T[] {
	return trails.filter((t) =>
		hub.kind === "country"
			? t.countries.includes(hub.code)
			: t.type === hub.type,
	);
}

export function hasHub(hub: Hub, trails: readonly HubTrail[]): boolean {
	return trailsIn(hub, trails).length >= minTrailsPerHub;
}

export function listHubs(trails: readonly HubTrail[]): Hub[] {
	const countries = [...new Set(trails.flatMap((t) => t.countries))].sort();
	return [
		...countries.map((code): Hub => ({ kind: "country", code })),
		...trailTypes.map((type): Hub => ({ kind: "type", type })),
	].filter((hub) => hasHub(hub, trails));
}

// URLs carry the lowercase ISO code; /en/country/TR/ is not a page.
export function countryHub(
	param: string | undefined,
	trails: readonly HubTrail[],
): Hub | null {
	if (!param || !/^[a-z]{2}$/.test(param)) return null;
	const hub: Hub = { kind: "country", code: param.toUpperCase() };
	return hasHub(hub, trails) ? hub : null;
}

export function typeHub(
	param: string | undefined,
	trails: readonly HubTrail[],
): Hub | null {
	const type = trailTypes.find((t) => t === param);
	if (!type) return null;
	const hub: Hub = { kind: "type", type };
	return hasHub(hub, trails) ? hub : null;
}
