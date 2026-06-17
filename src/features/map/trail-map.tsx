import {
	Layer,
	Map as MapLibreMap,
	Marker,
	Source,
} from "react-map-gl/maplibre";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailColors } from "~/features/trails/trail-style";
import { styleUrl } from "./map-setup";

type Props = {
	trail: TrailSummary;
	start: [number, number];
	end: [number, number];
	startLabel: string;
	endLabel: string;
};

export function TrailMap({ trail, start, end, startLabel, endLabel }: Props) {
	const [west, south, east, north] = trail.bbox;
	const loop = start[0] === end[0] && start[1] === end[1];

	return (
		<MapLibreMap
			initialViewState={{
				bounds: [
					[west, south],
					[east, north],
				],
				fitBoundsOptions: { padding: 32 },
			}}
			mapStyle={styleUrl}
			style={{ position: "absolute", inset: 0 }}
			cooperativeGestures
			dragRotate={false}
			touchPitch={false}
			attributionControl={{ compact: true }}
		>
			<Source
				id="trail"
				type="geojson"
				data={`/data/trails/${trail.slug}.geojson`}
			>
				<Layer
					id="trail-line"
					type="line"
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": trailColors[trail.type], "line-width": 4 }}
				/>
			</Source>
			<Marker longitude={start[0]} latitude={start[1]}>
				<span
					className="block size-4 rounded-full border-[3px] border-stone-900 bg-white"
					role="img"
					aria-label={startLabel}
				/>
			</Marker>
			{!loop && (
				<Marker longitude={end[0]} latitude={end[1]}>
					<span
						className="block size-4 rounded-full border-[3px] border-white bg-stone-900"
						role="img"
						aria-label={endLabel}
					/>
				</Marker>
			)}
		</MapLibreMap>
	);
}
