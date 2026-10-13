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

const regions = Object.keys(regionBounds) as [
	keyof typeof regionBounds,
	...(keyof typeof regionBounds)[],
];

const dayRange = z
	.strictObject({ min: z.int().positive(), max: z.int().positive() })
	.refine((d) => d.min <= d.max, { message: "min is larger than max" });

export const trailFileSchema = z
	.strictObject({
		slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		name: z.strictObject({ original: z.string().min(1) }),
		type: z.enum(trailTypes),
		region: z.enum(regions),
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
		verifiedAt: z.iso.date(),
	})
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

export type TrailSummary = Pick<
	TrailFile,
	| "slug"
	| "name"
	| "type"
	| "region"
	| "start"
	| "end"
	| "countries"
	| "bestSeason"
	| "badges"
> & {
	lengthKm: number;
	lengthSource: "official" | "osm";
	days: DayRange;
	bbox: [west: number, south: number, east: number, north: number];
	crosses: string[];
	nearby: string[];
};

export type TrailPhoto = {
	file: string;
	author: string;
	license: string;
	licenseUrl: string | null;
	sourceUrl: string;
	width: number;
	height: number;
	smallWidth: number;
	src: { small: string; large: string };
};
