import type {
	ExpressionSpecification,
	LineLayerSpecification,
} from "maplibre-gl";
import { Layer, Source } from "react-map-gl/maplibre";
import { trailColors } from "~/features/trails/trail-style";

export const trailSourceId = "trails";
export const trailHitLayerId = "trails-hit";

const active: ExpressionSpecification = [
	"boolean",
	["feature-state", "active"],
	false,
];

const color: ExpressionSpecification = [
	"match",
	["get", "type"],
	"pilgrimage",
	trailColors.pilgrimage,
	"historic",
	trailColors.historic,
	"coastal",
	trailColors.coastal,
	"mountain",
	trailColors.mountain,
	"e-path",
	trailColors["e-path"],
	"#777777",
];

function width(base: number): ExpressionSpecification {
	return [
		"interpolate",
		["linear"],
		["zoom"],
		3,
		["case", active, base * 2, base],
		10,
		["case", active, base * 3.5, base * 2],
	];
}

type Props = {
	dimmed: boolean;
	visible: string[] | null;
};

export function TrailLayers({ dimmed, visible }: Props) {
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

	return (
		<Source
			id={trailSourceId}
			type="geojson"
			data="/data/trails.geojson"
			promoteId="slug"
		>
			<Layer
				id="trails-solid"
				type="line"
				filter={only(["!=", ["get", "type"], "e-path"])}
				layout={layout}
				paint={{ ...paint, "line-width": width(2) }}
			/>
			<Layer
				id="trails-e-path"
				type="line"
				filter={only(["==", ["get", "type"], "e-path"])}
				layout={{ ...layout, "line-cap": "butt" }}
				paint={{
					...paint,
					"line-width": width(1.5),
					"line-dasharray": [3, 2],
				}}
			/>
			<Layer
				id={trailHitLayerId}
				type="line"
				filter={only(["boolean", true])}
				layout={layout}
				paint={{ "line-color": "#000000", "line-opacity": 0, "line-width": 24 }}
			/>
		</Source>
	);
}
