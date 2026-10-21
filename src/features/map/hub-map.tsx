import type { MapLayerMouseEvent } from "maplibre-gl";
import { useState } from "react";
import { Map as MapLibreMap, NavigationControl } from "react-map-gl/maplibre";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailPalettes } from "~/features/trails/trail-style";
import { canHover } from "~/shared/can-hover";
import { basemapColors } from "./basemap-colors";
import { boundsOf } from "./bounds";
import { MapLoading } from "./map-slot";
import { TrailLayers, trailHitLayerIds } from "./trail-layers";
import { useMapBase } from "./use-map-base";

type Props = {
	trails: readonly TrailSummary[];
	onPick: (slug: string) => void;
};

function slugAt(event: MapLayerMouseEvent): string | null {
	const slug = event.features?.[0]?.properties.slug;
	return typeof slug === "string" ? slug : null;
}

export function HubMap({ trails, onPick }: Props) {
	const { scheme, props } = useMapBase();
	const [loaded, setLoaded] = useState(false);
	const [pointer, setPointer] = useState(false);

	return (
		<>
			<MapLibreMap
				{...props}
				initialViewState={{
					bounds: boundsOf(trails),
					fitBoundsOptions: { padding: 32, maxZoom: 9 },
				}}
				cooperativeGestures
				interactiveLayerIds={trailHitLayerIds}
				cursor={pointer ? "pointer" : "grab"}
				onLoad={() => setLoaded(true)}
				onMouseMove={(event) => setPointer(slugAt(event) !== null)}
				onMouseLeave={() => setPointer(false)}
				onClick={(event) => {
					const slug = slugAt(event);
					if (slug) onPick(slug);
				}}
			>
				<NavigationControl position="top-right" showCompass={false} />
				<TrailLayers
					trails={trails}
					dimmed={false}
					visible={trails.map((t) => t.slug)}
					palette={trailPalettes[scheme]}
					halo={basemapColors[scheme].land}
					touch={!canHover()}
				/>
			</MapLibreMap>
			{!loaded && <MapLoading />}
		</>
	);
}
