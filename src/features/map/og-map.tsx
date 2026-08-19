import { useState } from "react";
import { Map as MapLibreMap } from "react-map-gl/maplibre";
import { styleUrl } from "./map-setup";
import { TrailLayers } from "./trail-layers";

export function OgMap() {
	const [ready, setReady] = useState(false);
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
				mapStyle={styleUrl}
				style={{ position: "absolute", inset: 0 }}
				interactive={false}
				attributionControl={false}
				onIdle={() => setReady(true)}
			>
				<TrailLayers dimmed={false} visible={null} weight={2.5} />
			</MapLibreMap>
		</div>
	);
}
