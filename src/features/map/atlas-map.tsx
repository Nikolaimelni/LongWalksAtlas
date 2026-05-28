import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Map as MapLibreMap } from "react-map-gl/maplibre";

setWorkerUrl(workerUrl);

const styleUrl = "https://tiles.openfreemap.org/styles/positron";

const europeBounds: [[number, number], [number, number]] = [
	[-12, 34],
	[45, 71],
];

export function AtlasMap() {
	return (
		<MapLibreMap
			initialViewState={{
				bounds: europeBounds,
				fitBoundsOptions: { padding: 16 },
			}}
			mapStyle={styleUrl}
			style={{ position: "absolute", inset: 0 }}
			dragRotate={false}
			touchPitch={false}
			attributionControl={{ compact: true }}
		/>
	);
}
