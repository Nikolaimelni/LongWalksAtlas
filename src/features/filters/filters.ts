import { z } from "zod";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailRegions, trailTypes } from "~/features/trails/trail-schema";

export const lengthBuckets = {
	short: [0, 200],
	medium: [200, 500],
	long: [500, 1000],
	epic: [1000, Number.POSITIVE_INFINITY],
} as const;

export const dayBuckets = {
	week: [1, 7],
	fortnight: [8, 14],
	month: [15, 30],
	more: [31, Number.POSITIVE_INFINITY],
} as const;

type LengthBucket = keyof typeof lengthBuckets;
type DayBucket = keyof typeof dayBuckets;

const lengthKeys = Object.keys(lengthBuckets) as [
	LengthBucket,
	...LengthBucket[],
];
const dayKeys = Object.keys(dayBuckets) as [DayBucket, ...DayBucket[]];

// A comma-separated list in the URL, keeping the values it knows and dropping the rest.
function listOf<const T extends readonly [string, ...string[]]>(values: T) {
	return z
		.string()
		.transform((value) =>
			value.split(",").filter((v) => (values as readonly string[]).includes(v)),
		)
		.pipe(z.array(z.enum(values)))
		.catch([]);
}

const filtersSchema = z.object({
	q: z.string().trim().max(80).catch(""),
	types: listOf(trailTypes),
	regions: listOf(trailRegions),
	country: z
		.string()
		.regex(/^[A-Z]{2}$/)
		.nullable()
		.catch(null),
	length: z.enum(lengthKeys).nullable().catch(null),
	days: z.enum(dayKeys).nullable().catch(null),
});

export type Filters = z.infer<typeof filtersSchema>;

export const emptyFilters: Filters = {
	q: "",
	types: [],
	regions: [],
	country: null,
	length: null,
	days: null,
};

export function parseFilters(params: URLSearchParams): Filters {
	return filtersSchema.parse({
		q: params.get("q") ?? "",
		types: params.get("type") ?? "",
		regions: params.get("region") ?? "",
		country: params.get("country"),
		length: params.get("length"),
		days: params.get("days"),
	});
}

export function writeFilters(
	params: URLSearchParams,
	filters: Filters,
): URLSearchParams {
	const next = new URLSearchParams(params);
	const set = (key: string, value: string | null) => {
		if (value) next.set(key, value);
		else next.delete(key);
	};
	set("q", filters.q.trim() || null);
	set("type", filters.types.length > 0 ? filters.types.join(",") : null);
	set("region", filters.regions.length > 0 ? filters.regions.join(",") : null);
	set("country", filters.country);
	set("length", filters.length);
	set("days", filters.days);
	return next;
}

const overlaps = (
	[min, max]: readonly [number, number],
	[from, to]: readonly [number, number],
) => min <= to && max >= from;

// Length buckets share their edges (200, 500, 1000), so the upper edge is open: a
// 500 km trail is 500–1000, not also 200–500. Day buckets do not touch.
const inBucket = (km: number, [from, to]: readonly [number, number]) =>
	km >= from && km < to;

export function applyFilters(
	trails: readonly TrailSummary[],
	filters: Omit<Filters, "q">,
): TrailSummary[] {
	return trails.filter(
		(t) =>
			(filters.types.length === 0 || filters.types.includes(t.type)) &&
			(filters.regions.length === 0 || filters.regions.includes(t.region)) &&
			(!filters.country || t.countries.includes(filters.country)) &&
			(!filters.length ||
				inBucket(t.lengthKm, lengthBuckets[filters.length])) &&
			(!filters.days ||
				overlaps([t.days.min, t.days.max], dayBuckets[filters.days])),
	);
}

export function countActive(filters: Filters): number {
	return (
		filters.types.length +
		filters.regions.length +
		[filters.country, filters.length, filters.days].filter(Boolean).length
	);
}
