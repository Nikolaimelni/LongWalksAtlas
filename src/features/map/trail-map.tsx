import { type ReactNode, use, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Layer,
	Map as MapLibreMap,
	Marker,
	NavigationControl,
	Source,
} from "react-map-gl/maplibre";
import { useLang } from "~/features/i18n/use-lang";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailPalettes } from "~/features/trails/trail-style";
import { useColorScheme } from "~/shared/use-color-scheme";
import { useMapFailure } from "./map-boundary";
import { loadMapStyle } from "./map-style";

type Props = {
	trail: TrailSummary;
	start: [number, number];
	end: [number, number];
	startLabel: string;
	endLabel: string;
	loading: ReactNode;
};

export function TrailMap({
	trail,
	start,
	end,
	startLabel,
	endLabel,
	loading,
}: Props) {
	const scheme = useColorScheme();
	const [loaded, setLoaded] = useState(false);
	const lang = useLang();
	const { t } = useTranslation();
	const mapStyle = use(loadMapStyle(scheme, lang));
	const onError = useMapFailure();
	const [west, south, east, north] = trail.bbox;
	const loop = start[0] === end[0] && start[1] === end[1];

	return (
		<>
			<MapLibreMap
				initialViewState={{
					bounds: [
						[west, south],
						[east, north],
					],
					fitBoundsOptions: { padding: 32 },
				}}
				mapStyle={mapStyle}
				onError={onError}
				style={{ position: "absolute", inset: 0 }}
				cooperativeGestures
				dragRotate={false}
				touchPitch={false}
				attributionControl={{ compact: true }}
				locale={{
					"NavigationControl.ZoomIn": t("atlas.zoomIn"),
					"NavigationControl.ZoomOut": t("atlas.zoomOut"),
				}}
				onLoad={() => setLoaded(true)}
			>
				<NavigationControl position="top-right" showCompass={false} />
				<Source
					id="trail"
					type="geojson"
					data={`/data/trails/${trail.slug}.geojson`}
				>
					<Layer
						id="trail-line"
						type="line"
						layout={{ "line-cap": "round", "line-join": "round" }}
						paint={{
							"line-color": trailPalettes[scheme][trail.type],
							"line-width": 4,
						}}
					/>
				</Source>
				<Marker longitude={start[0]} latitude={start[1]}>
					<span
						className="block size-4 rounded-full border-[3px] border-brand bg-surface"
						role="img"
						aria-label={startLabel}
					/>
				</Marker>
				{!loop && (
					<Marker longitude={end[0]} latitude={end[1]}>
						<span
							className="block size-4 rounded-full border-[3px] border-white bg-brand"
							role="img"
							aria-label={endLabel}
						/>
					</Marker>
				)}
			</MapLibreMap>
			{!loaded && loading}
		</>
	);
}
