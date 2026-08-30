import { use, useState } from "react";
import { Map as MapLibreMap } from "react-map-gl/maplibre";
import { trailPalettes } from "~/features/trails/trail-style";
import { loadMapStyle } from "./map-style";
import { TrailLayers } from "./trail-layers";

export function OgMap() {
	const [ready, setReady] = useState(false);
	const mapStyle = use(loadMapStyle("light"));
	return (
		<div className="absolute inset-0" data-ready={ready || undefined}>
			<MapLibreMap
				initialViewState={{
					bounds: [
						[-14, 34],
						[42, 71],
					],
					fitBoundsOptions: {
						padding: { top: 24, bottom: 24, left: 380, right: 24 },
					},
				}}
				mapStyle={mapStyle}
				style={{ position: "absolute", inset: 0 }}
				interactive={false}
				attributionControl={false}
				onIdle={() => setReady(true)}
			>
				<TrailLayers
					dimmed={false}
					visible={null}
					weight={2.5}
					palette={trailPalettes.light}
				/>
			</MapLibreMap>
		</div>
	);
}
