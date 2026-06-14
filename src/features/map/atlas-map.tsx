import "maplibre-gl/dist/maplibre-gl.css";
import { type MapLayerMouseEvent, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, type MapRef } from "react-map-gl/maplibre";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { TrailLayers, trailHitLayerId, trailSourceId } from "./trail-layers";

setWorkerUrl(workerUrl);

const styleUrl = "https://tiles.openfreemap.org/styles/positron";

const europeBounds: [[number, number], [number, number]] = [
	[-12, 34],
	[45, 71],
];

export type HoverInfo = { slugs: string[]; x: number; y: number };

type Props = {
	selected: TrailSummary | null;
	hovered: HoverInfo | null;
	onHover: (info: HoverInfo | null) => void;
	onPick: (slugs: string[]) => void;
};

function slugsAt(event: MapLayerMouseEvent): string[] {
	const slugs = (event.features ?? []).map((f) => String(f.properties.slug));
	return [...new Set(slugs)];
}

export function AtlasMap({ selected, hovered, onHover, onPick }: Props) {
	const mapRef = useRef<MapRef>(null);
	const [loaded, setLoaded] = useState(false);
	const highlighted = hovered?.slugs ?? (selected ? [selected.slug] : []);
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
		if (!map || !loaded || !selected) return;
		const [west, south, east, north] = selected.bbox;
		const phone = map.getContainer().clientWidth < 768;
		map.fitBounds(
			[
				[west, south],
				[east, north],
			],
			{
				padding: phone
					? {
							top: 72,
							bottom: map.getContainer().clientHeight * 0.55,
							left: 24,
							right: 24,
						}
					: { top: 72, bottom: 48, left: 420, right: 48 },
				maxZoom: 11,
				duration: 800,
			},
		);
	}, [selected, loaded]);

	return (
		<MapLibreMap
			ref={mapRef}
			initialViewState={{
				bounds: europeBounds,
				fitBoundsOptions: { padding: 16 },
			}}
			mapStyle={styleUrl}
			style={{ position: "absolute", inset: 0 }}
			dragRotate={false}
			touchPitch={false}
			attributionControl={{ compact: true }}
			interactiveLayerIds={[trailHitLayerId]}
			cursor={hovered ? "pointer" : "grab"}
			onLoad={() => setLoaded(true)}
			onMouseMove={(event) => {
				const slugs = slugsAt(event);
				onHover(
					slugs.length > 0
						? { slugs, x: event.point.x, y: event.point.y }
						: null,
				);
			}}
			onMouseLeave={() => onHover(null)}
			onClick={(event) => onPick(slugsAt(event))}
		>
			<TrailLayers dimmed={highlighted.length > 0} />
		</MapLibreMap>
	);
}
