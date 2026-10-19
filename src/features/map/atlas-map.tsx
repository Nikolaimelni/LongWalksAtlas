import type { MapLayerMouseEvent } from "maplibre-gl";
import { type ReactNode, use, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Map as MapLibreMap,
	type MapRef,
	NavigationControl,
} from "react-map-gl/maplibre";
import { useLang } from "~/features/i18n/use-lang";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailPalettes } from "~/features/trails/trail-style";
import { canHover } from "~/shared/can-hover";
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
const phoneBar = 160;

export type HoverInfo = { slugs: string[]; x: number; y: number };

type Props = {
	trails: readonly TrailSummary[];
	focus: TrailSummary | null;
	highlighted: string[];
	visible: string[] | null;
	// What the camera frames when the place filters change. Only region and country move
	// it: following the search would shake the map on every letter typed.
	frame: {
		key: string;
		trails: readonly TrailSummary[];
		underPanel: boolean;
	};
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
	frame,
	loading,
	onHover,
	onPick,
}: Props) {
	const mapRef = useRef<MapRef>(null);
	const scheme = useColorScheme();
	const lang = useLang();
	const { t } = useTranslation();
	const mapStyle = use(loadMapStyle(scheme, lang));
	const onError = useMapFailure();
	const [loaded, setLoaded] = useState(false);
	const [pointer, setPointer] = useState(false);
	const byMouse = useRef(false);
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

	// DOM pointer events, which say what moved: a laptop with a touch screen can match
	// neither hover media query and still have a mouse, and iOS turns a tap into mouse
	// events too. When the hover changed the page, Safari swallowed the click, so the
	// first tap showed a card without a button.
	useEffect(() => {
		const container = mapRef.current?.getMap().getCanvasContainer();
		if (!container || !loaded) return;
		const note = (event: PointerEvent) => {
			byMouse.current = event.pointerType === "mouse";
		};
		container.addEventListener("pointermove", note);
		container.addEventListener("pointerdown", note);
		return () => {
			container.removeEventListener("pointermove", note);
			container.removeEventListener("pointerdown", note);
		};
	}, [loaded]);

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

	// MapLibre camera, for the place filters. A link that comes in with them is framed
	// by the initial view.
	const framed = useRef(frame.key);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the trails and the panel are read when the key changes; a new list under the same filters must not move the camera again.
	useEffect(() => {
		const map = mapRef.current?.getMap();
		if (!map || !loaded || framed.current === frame.key) return;
		framed.current = frame.key;
		if (focus || frame.trails.length === 0) return;
		const { clientWidth, clientHeight } = map.getContainer();
		const phone = clientWidth < md;
		map.fitBounds(boundsOf(frame.trails), {
			padding: phone
				? {
						top: header,
						bottom: frame.underPanel ? clientHeight * 0.6 : phoneBar,
						left: 24,
						right: 24,
					}
				: { top: header, bottom: 24, left: panelEdge + 24, right: 24 },
			maxZoom: 9,
			duration: 800,
		});
	}, [frame.key, loaded]);

	return (
		<>
			<MapLibreMap
				ref={mapRef}
				initialViewState={initialView(
					frame.trails.length > 0 ? frame.trails : trails,
				)}
				mapStyle={mapStyle}
				onError={onError}
				style={{ position: "absolute", inset: 0 }}
				dragRotate={false}
				touchPitch={false}
				attributionControl={{ compact: true }}
				locale={{
					"NavigationControl.ZoomIn": t("atlas.zoomIn"),
					"NavigationControl.ZoomOut": t("atlas.zoomOut"),
				}}
				interactiveLayerIds={trailHitLayerIds}
				cursor={pointer ? "pointer" : "grab"}
				onLoad={() => setLoaded(true)}
				onMouseMove={(event) => {
					if (!byMouse.current) return;
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
				{/* Besides zooming without a pinch, the buttons tell a first-time visitor that
				the map moves at all. */}
				<NavigationControl position="top-right" showCompass={false} />
				<TrailLayers
					trails={trails}
					dimmed={highlighted.length > 0}
					visible={visible}
					palette={trailPalettes[scheme]}
					halo={basemapColors[scheme].land}
					touch={!canHover()}
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
