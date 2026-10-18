import type { MapLayerMouseEvent } from "maplibre-gl";
import { type ReactNode, use, useState } from "react";
import { Map as MapLibreMap } from "react-map-gl/maplibre";
import { useLang } from "~/features/i18n/use-lang";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailPalettes } from "~/features/trails/trail-style";
import { useColorScheme } from "~/shared/use-color-scheme";
import { basemapColors } from "./basemap-colors";
import { boundsOf } from "./bounds";
import { useMapFailure } from "./map-boundary";
import { loadMapStyle } from "./map-style";
import { TrailLayers, trailHitLayerIds } from "./trail-layers";

type Props = {
	trails: readonly TrailSummary[];
	loading: ReactNode;
	onPick: (slug: string) => void;
};

function slugAt(event: MapLayerMouseEvent): string | null {
	const slug = event.features?.[0]?.properties.slug;
	return typeof slug === "string" ? slug : null;
}

export function HubMap({ trails, loading, onPick }: Props) {
	const scheme = useColorScheme();
	const lang = useLang();
	const mapStyle = use(loadMapStyle(scheme, lang));
	const onError = useMapFailure();
	const [loaded, setLoaded] = useState(false);
	const [pointer, setPointer] = useState(false);

	return (
		<>
			<MapLibreMap
				initialViewState={{
					bounds: boundsOf(trails),
					fitBoundsOptions: { padding: 32, maxZoom: 9 },
				}}
				mapStyle={mapStyle}
				onError={onError}
				style={{ position: "absolute", inset: 0 }}
				cooperativeGestures
				dragRotate={false}
				touchPitch={false}
				attributionControl={{ compact: true }}
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
				<TrailLayers
					trails={trails}
					dimmed={false}
					visible={trails.map((t) => t.slug)}
					palette={trailPalettes[scheme]}
					halo={basemapColors[scheme].land}
				/>
			</MapLibreMap>
			{!loaded && loading}
		</>
	);
}
