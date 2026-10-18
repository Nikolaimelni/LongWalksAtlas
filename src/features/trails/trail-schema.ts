import { z } from "zod";

export const trailTypes = [
	"pilgrimage",
	"historic",
	"coastal",
	"mountain",
	"e-path",
] as const;

const months = [
	"jan",
	"feb",
	"mar",
	"apr",
	"may",
	"jun",
	"jul",
	"aug",
	"sep",
	"oct",
	"nov",
	"dec",
] as const;

const lngLat = z.tuple([
	z.number().gte(-180).lte(180),
	z.number().gte(-90).lte(90),
]);

const place = z.strictObject({
	name: z.string().min(1),
	coords: lngLat,
});

const regionBounds = {
	europe: { west: -32, south: 27, east: 45, north: 72 },
	"middle-east-caucasus": { west: 25, south: 12, east: 63, north: 45 },
	asia: { west: 60, south: -11, east: 150, north: 56 },
	africa: { west: -26, south: -36, east: 52, north: 38 },
	americas: { west: -170, south: -56, east: -34, north: 72 },
	oceania: { west: 110, south: -48, east: 180, north: 0 },
} as const;

export const trailRegions = Object.keys(regionBounds) as [
	keyof typeof regionBounds,
	...(keyof typeof regionBounds)[],
];

const dayRange = z
	.strictObject({ min: z.int().positive(), max: z.int().positive() })
	.refine((d) => d.min <= d.max, { message: "min is larger than max" });

// The fields of a trail file, without the checks across fields: Zod will not pick()
// from a schema that carries refinements, and the summary below picks from this.
const trailFields = z.strictObject({
		slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		name: z.strictObject({ original: z.string().min(1) }),
		type: z.enum(trailTypes),
		region: z.enum(trailRegions),
		start: place,
		end: place,
		countries: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1),
		lengthKm: z.number().positive().nullable(),
		days: dayRange.nullable(),
		bestSeason: z.array(z.enum(months)),
		badges: z.array(z.enum(["coe-cultural-route", "unesco"])),
		officialUrl: z.url({ protocol: /^https$/ }),
		sources: z.array(z.url({ protocol: /^https?$/ })).min(1),
		photo: z
			.strictObject({
				commons: z.string().regex(/^File:.+\.(jpe?g|png|tiff?|webp)$/i),
			})
			.nullable(),
		wikidata: z
			.string()
			.regex(/^Q[1-9][0-9]*$/)
			.nullable(),
		geometry: z.strictObject({
			source: z.literal("osm"),
			relationIds: z.array(z.int().positive()).min(1),
			mode: z.enum(["main-line", "all-ways"]).optional(),
		}),
	});

export const trailFileSchema = trailFields
	.refine((t) => inRegion(t.start.coords, t.region), {
		path: ["start", "coords"],
		message: "outside the trail's region; is it [lng, lat]?",
	})
	.refine((t) => inRegion(t.end.coords, t.region), {
		path: ["end", "coords"],
		message: "outside the trail's region; is it [lng, lat]?",
	});

function inRegion(
	[lng, lat]: [number, number],
	region: keyof typeof regionBounds,
): boolean {
	const b = regionBounds[region];
	return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
}

export type TrailFile = z.infer<typeof trailFileSchema>;
export type TrailType = TrailFile["type"];
export type DayRange = NonNullable<TrailFile["days"]>;

// One line of src/generated/trails-index.json, written by scripts/build-data.ts and
// checked against this before it is written.
export const trailSummarySchema = trailFields
	.pick({
		slug: true,
		name: true,
		type: true,
		region: true,
		start: true,
		end: true,
		countries: true,
		bestSeason: true,
		badges: true,
	})
	.extend({
		lengthKm: z.number().positive(),
		lengthSource: z.enum(["official", "osm"]),
		days: dayRange,
		// "estimate" when no source gives the days and they come from the length.
		daysSource: z.enum(["official", "estimate"]),
		bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
		crosses: z.array(z.string()),
		nearby: z.array(z.string()),
	});

export type TrailSummary = z.infer<typeof trailSummarySchema>;

// One entry of src/generated/photos.json, written and checked by scripts/build-photos.ts.
export const trailPhotoSchema = z.strictObject({
	file: z.string(),
	author: z.string().min(1),
	license: z.string().min(1),
	licenseUrl: z.url({ protocol: /^https?$/ }).nullable(),
	sourceUrl: z.url({ protocol: /^https$/ }),
	width: z.int().positive(),
	height: z.int().positive(),
	smallWidth: z.int().positive(),
	src: z.strictObject({ small: z.string(), large: z.string() }),
});

export type TrailPhoto = z.infer<typeof trailPhotoSchema>;
