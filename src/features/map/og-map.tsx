import { use, useState } from "react";
import { Map as MapLibreMap } from "react-map-gl/maplibre";
import { useLang } from "~/features/i18n/use-lang";
import { trailPalettes } from "~/features/trails/trail-style";
import { trailsIndex } from "~/features/trails/trails-index";
import { basemapColors } from "./basemap-colors";
import { loadMapStyle } from "./map-style";
import { TrailLayers } from "./trail-layers";

export function OgMap() {
	const [ready, setReady] = useState(false);
	const lang = useLang();
	const mapStyle = use(loadMapStyle("light", lang));
	return (
		<div className="absolute inset-0" data-ready={ready || undefined}>
			<MapLibreMap
				initialViewState={{
					bounds: [
						[-125, -47],
						[178, 71],
					],
					fitBoundsOptions: {
						padding: { top: 24, bottom: 24, left: 560, right: 24 },
					},
				}}
				mapStyle={mapStyle}
				style={{ position: "absolute", inset: 0 }}
				interactive={false}
				attributionControl={false}
				onIdle={() => setReady(true)}
			>
				<TrailLayers
					trails={trailsIndex}
					dimmed={false}
					visible={null}
					weight={2.5}
					palette={trailPalettes.light}
					halo={basemapColors.light.land}
				/>
			</MapLibreMap>
		</div>
	);
}
