import type { MapLayerMouseEvent } from "maplibre-gl";
import { use, useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, type MapRef } from "react-map-gl/maplibre";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailPalettes } from "~/features/trails/trail-style";
import { useColorScheme } from "~/shared/use-color-scheme";
import { loadMapStyle } from "./map-style";
import { TrailLayers, trailHitLayerId, trailSourceId } from "./trail-layers";

const europeBounds: [[number, number], [number, number]] = [
	[-12, 34],
	[45, 71],
];

export type HoverInfo = { slugs: string[]; x: number; y: number };

type Props = {
	focus: TrailSummary | null;
	highlighted: string[];
	visible: string[] | null;
	onHover: (info: HoverInfo | null) => void;
	onPick: (slugs: string[]) => void;
};

function slugsAt(event: MapLayerMouseEvent): string[] {
	const slugs = (event.features ?? []).map((f) => String(f.properties.slug));
	return [...new Set(slugs)];
}

export function AtlasMap({
	focus,
	highlighted,
	visible,
	onHover,
	onPick,
}: Props) {
	const mapRef = useRef<MapRef>(null);
	const scheme = useColorScheme();
	const mapStyle = use(loadMapStyle(scheme));
	const [loaded, setLoaded] = useState(false);
	const [pointer, setPointer] = useState(false);
	const highlightKey = highlighted.join(",");

	useEffect(() => {
		const map = mapRef.current?.getMap();
		if (!map || !loaded || !highlightKey) return;
		const ids = highlightKey.split(",");
		for (const id of ids) {
			map.setFeatureState({ source: trailSourceId, id }, { active: true });
		}
		return () => {
			for (const id of ids) {
				map.setFeatureState({ source: trailSourceId, id }, { active: false });
			}
		};
	}, [highlightKey, loaded]);

	useEffect(() => {
		const map = mapRef.current?.getMap();
		if (!map || !loaded || !focus) return;
		const [west, south, east, north] = focus.bbox;
		const { clientWidth, clientHeight } = map.getContainer();
		const phone = clientWidth < 768;
		map.fitBounds(
			[
				[west, south],
				[east, north],
			],
			{
				padding: phone
					? { top: 72, bottom: clientHeight * 0.55, left: 24, right: 24 }
					: {
							top: 72,
							bottom: 48,
							left: Math.min(816, clientWidth / 2),
							right: 48,
						},
				maxZoom: 11,
				duration: 800,
			},
		);
	}, [focus, loaded]);

	return (
		<MapLibreMap
			ref={mapRef}
			initialViewState={{
				bounds: europeBounds,
				fitBoundsOptions: { padding: 16 },
			}}
			mapStyle={mapStyle}
			style={{ position: "absolute", inset: 0 }}
			dragRotate={false}
			touchPitch={false}
			attributionControl={{ compact: true }}
			interactiveLayerIds={[trailHitLayerId]}
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
				dimmed={highlighted.length > 0}
				visible={visible}
				palette={trailPalettes[scheme]}
			/>
		</MapLibreMap>
	);
}
