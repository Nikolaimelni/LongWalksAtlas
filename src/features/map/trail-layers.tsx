import type { FeatureCollection, Point } from "geojson";
import type {
	CircleLayerSpecification,
	ExpressionSpecification,
	LineLayerSpecification,
} from "maplibre-gl";
import { Layer, Source } from "react-map-gl/maplibre";
import {
	type TrailSummary,
	type TrailType,
	trailTypes,
} from "~/features/trails/trail-schema";
import type { TrailPalette } from "~/features/trails/trail-style";

export const trailSourceId = "trails";
export const trailPointSourceId = "trail-starts";
export const trailHitLayerIds = ["trails-hit", "trail-starts-hit"];

// A 60 km trail is a couple of pixels long on a map of the world, so until the lines
// are long enough to see, each trail also gets a dot where it starts.
const pointsUntilZoom = 7;

const active: ExpressionSpecification = [
	"boolean",
	["feature-state", "active"],
	false,
];

function colorBy(palette: TrailPalette): ExpressionSpecification {
	// why: MapLibre types "match" as a tuple with its pairs spelled out, which a list
	// built from trailTypes cannot satisfy; built this way a new type is never missed.
	return [
		"match",
		["get", "type"],
		...trailTypes.flatMap((type) => [type, palette[type]]),
		"#777777",
	] as unknown as ExpressionSpecification;
}

function width(base: number, edge = 0): ExpressionSpecification {
	return [
		"interpolate",
		["linear"],
		["zoom"],
		3,
		["case", active, base * 2 + edge, base + edge],
		10,
		["case", active, base * 3.5 + edge, base * 2 + edge],
	];
}

function startPoints(
	trails: readonly TrailSummary[],
): FeatureCollection<Point, { slug: string; type: TrailType }> {
	return {
		type: "FeatureCollection",
		features: trails.map((trail) => ({
			type: "Feature",
			properties: { slug: trail.slug, type: trail.type },
			geometry: { type: "Point", coordinates: trail.start.coords },
		})),
	};
}

type Props = {
	trails: readonly TrailSummary[];
	dimmed: boolean;
	visible: string[] | null;
	weight?: number;
	palette: TrailPalette;
	// The land colour, drawn round each dot so neighbours stay apart.
	halo: string;
	// A finger needs a wider catch than a mouse pointer. Where two catches overlap, the
	// atlas asks which trail was meant, so the wider one costs a question, not a miss.
	touch?: boolean;
};

export function TrailLayers({
	trails,
	dimmed,
	visible,
	weight = 1,
	palette,
	halo,
	touch = false,
}: Props) {
	const color = colorBy(palette);
	const only = (base: ExpressionSpecification): ExpressionSpecification =>
		visible
			? ["all", base, ["in", ["get", "slug"], ["literal", visible]]]
			: base;
	const opacity: ExpressionSpecification = [
		"case",
		active,
		1,
		dimmed ? 0.3 : 0.9,
	];
	const paint = {
		"line-color": color,
		"line-opacity": opacity,
	} satisfies LineLayerSpecification["paint"];
	const layout = {
		"line-cap": "round",
		"line-join": "round",
	} satisfies LineLayerSpecification["layout"];
	const fadeOut: ExpressionSpecification = [
		"interpolate",
		["linear"],
		["zoom"],
		pointsUntilZoom - 2,
		["case", active, 1, dimmed ? 0.35 : 1],
		pointsUntilZoom,
		0,
	];
	// Dots grow slower than lines: at 2.5 times the weight they would cover a continent.
	const dot = Math.sqrt(weight);
	const dots = {
		"circle-color": color,
		"circle-radius": [
			"interpolate",
			["linear"],
			["zoom"],
			1,
			["case", active, 6 * dot, 4 * dot],
			5,
			["case", active, 8 * dot, 5.5 * dot],
		],
		"circle-stroke-color": halo,
		"circle-stroke-width": 1.5,
		"circle-opacity": fadeOut,
		"circle-stroke-opacity": fadeOut,
	} satisfies CircleLayerSpecification["paint"];

	return (
		<>
			<Source
				id={trailSourceId}
				type="geojson"
				data="/data/trails.geojson"
				promoteId="slug"
			>
				{/* A land-coloured edge under every line, as on a printed map: a trail along
				a coast or through a forest keeps its contrast, and crossing trails stay
				apart. */}
				<Layer
					id="trails-casing"
					type="line"
					filter={only(["boolean", true])}
					layout={layout}
					paint={{
						"line-color": halo,
						"line-opacity": opacity,
						"line-width": width(2 * weight, 3),
					}}
				/>
				<Layer
					id="trails-solid"
					type="line"
					filter={only(["boolean", true])}
					layout={layout}
					paint={{ ...paint, "line-width": width(2 * weight) }}
				/>
				<Layer
					id="trails-hit"
					type="line"
					filter={only(["boolean", true])}
					layout={layout}
					paint={{
						"line-color": "#000000",
						"line-opacity": 0,
						"line-width": touch ? 32 : 24,
					}}
				/>
			</Source>
			<Source
				id={trailPointSourceId}
				type="geojson"
				data={startPoints(trails)}
				promoteId="slug"
			>
				<Layer
					id="trail-starts"
					type="circle"
					maxzoom={pointsUntilZoom}
					filter={only(["boolean", true])}
					paint={dots}
				/>
				<Layer
					id="trail-starts-hit"
					type="circle"
					maxzoom={pointsUntilZoom - 1}
					filter={only(["boolean", true])}
					paint={{ "circle-radius": touch ? 20 : 12, "circle-opacity": 0 }}
				/>
			</Source>
		</>
	);
}
