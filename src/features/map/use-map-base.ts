import { use } from "react";
import { useTranslation } from "react-i18next";
import type { MapProps } from "react-map-gl/maplibre";
import { useLang } from "~/features/i18n/use-lang";
import { useColorScheme } from "~/shared/use-color-scheme";
import { useMapFailure } from "./map-boundary";
import { loadMapStyle } from "./map-style";

export function useMapBase() {
	const scheme = useColorScheme();
	const lang = useLang();
	const { t } = useTranslation();
	const mapStyle = use(loadMapStyle(scheme, lang));
	const onError = useMapFailure();
	const props = {
		mapStyle,
		onError,
		style: { position: "absolute", inset: 0 },
		dragRotate: false,
		touchPitch: false,
		attributionControl: { compact: true },
		locale: {
			"NavigationControl.ZoomIn": t("atlas.zoomIn"),
			"NavigationControl.ZoomOut": t("atlas.zoomOut"),
		},
	} satisfies Partial<MapProps>;
	return { scheme, props };
}
