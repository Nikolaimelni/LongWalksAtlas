import type { MapLayerMouseEvent } from "maplibre-gl";
import { type ReactNode, use, useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, type MapRef } from "react-map-gl/maplibre";
import { useLang } from "~/features/i18n/use-lang";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailPalettes } from "~/features/trails/trail-style";
import { useColorScheme } from "~/shared/use-color-scheme";
import { basemapColors } from "./basemap-colors";
import { boundsOf } from "./bounds";
import { useMapFailure } from "./map-boundary";
import { loadMapStyle } from "./map-style";
import {
	TrailLayers,
	trailHitLayerIds,
	trailPointSourceId,
	trailSourceId,
} from "./trail-layers";

// What covers the map on a wide screen, in px: the trail panel (md:start-4 md:w-96 in
// trail-panel.tsx) and the preview sheet next to it (md:start-[26rem] md:w-96 in
// routes/atlas.tsx). Below Tailwind's md the panel folds into a bar at the bottom.
const md = 768;
const panelEdge = 16 + 384;
const sheetEdge = 416 + 384;
const header = 72;
const phoneBar = 120;

export type HoverInfo = { slugs: string[]; x: number; y: number };

type Props = {
	trails: readonly TrailSummary[];
	focus: TrailSummary | null;
	highlighted: string[];
	visible: string[] | null;
	loading: ReactNode;
	onHover: (info: HoverInfo | null) => void;
	onPick: (slugs: string[]) => void;
};

function slugsAt(event: MapLayerMouseEvent): string[] {
	const slugs = (event.features ?? []).map((f) => String(f.properties.slug));
	return [...new Set(slugs)];
}

function initialView(trails: readonly TrailSummary[]) {
	const phone = window.innerWidth < md;
	return {
		bounds: boundsOf(trails),
		fitBoundsOptions: {
			padding: phone
				? { top: header, bottom: phoneBar, left: 8, right: 8 }
				: { top: header, bottom: 24, left: panelEdge + 24, right: 24 },
		},
	};
}

export function AtlasMap({
	trails,
	focus,
	highlighted,
	visible,
	loading,
	onHover,
	onPick,
}: Props) {
	const mapRef = useRef<MapRef>(null);
	const scheme = useColorScheme();
	const lang = useLang();
	const mapStyle = use(loadMapStyle(scheme, lang));
	const onError = useMapFailure();
	const [loaded, setLoaded] = useState(false);
	const [pointer, setPointer] = useState(false);
	// A string, so that a new array with the same trails does not rerun the effect.
	const highlightKey = highlighted.join(",");

	// MapLibre feature state.
	useEffect(() => {
		const map = mapRef.current?.getMap();
		if (!map || !loaded || !highlightKey) return;
		const ids = highlightKey.split(",");
		const mark = (state: boolean) => {
			for (const id of ids) {
				for (const source of [trailSourceId, trailPointSourceId]) {
					// A new style (another language, the device going dark) drops the sources
					// until it has loaded; the highlight comes back with the next hover.
					if (!map.getSource(source)) continue;
					map.setFeatureState({ source, id }, { active: state });
				}
			}
		};
		mark(true);
		return () => mark(false);
	}, [highlightKey, loaded]);

	// MapLibre camera.
	useEffect(() => {
		const map = mapRef.current?.getMap();
		if (!map || !loaded || !focus) return;
		const [west, south, east, north] = focus.bbox;
		const { clientWidth, clientHeight } = map.getContainer();
		const phone = clientWidth < md;
		map.fitBounds(
			[
				[west, south],
				[east, north],
			],
			{
				padding: phone
					? { top: header, bottom: clientHeight * 0.55, left: 24, right: 24 }
					: {
							top: header,
							bottom: 48,
							left: Math.min(sheetEdge + 16, clientWidth / 2),
							right: 48,
						},
				maxZoom: 11,
				duration: 800,
			},
		);
	}, [focus, loaded]);

	return (
		<>
			<MapLibreMap
				ref={mapRef}
				initialViewState={initialView(trails)}
				mapStyle={mapStyle}
				onError={onError}
				style={{ position: "absolute", inset: 0 }}
				dragRotate={false}
				touchPitch={false}
				attributionControl={{ compact: true }}
				interactiveLayerIds={trailHitLayerIds}
				cursor={pointer ? "pointer" : "grab"}
				onLoad={() => setLoaded(true)}
				onMouseMove={(event) => {
					const slugs = slugsAt(event);
					setPointer(slugs.length > 0);
					onHover(
						slugs.length > 0
							? { slugs, x: event.point.x, y: event.point.y }
							: null,
					);
				}}
				onMouseLeave={() => {
					setPointer(false);
					onHover(null);
				}}
				onClick={(event) => onPick(slugsAt(event))}
			>
				<TrailLayers
					trails={trails}
					dimmed={highlighted.length > 0}
					visible={visible}
					palette={trailPalettes[scheme]}
					halo={basemapColors[scheme].land}
				/>
			</MapLibreMap>
			<div
				aria-hidden={loaded || undefined}
				className={`absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${loaded ? "pointer-events-none opacity-0" : ""}`}
			>
				{loading}
			</div>
		</>
	);
}
