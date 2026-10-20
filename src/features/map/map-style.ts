import type { StyleSpecification } from "maplibre-gl";
import type { Lang } from "~/features/i18n/languages";
import type { Scheme } from "~/features/trails/trail-style";
import { basemapPatches } from "./basemap-colors";
import "./map-setup";
import { mapStyles } from "./map-sources";

const colorKey = {
	background: "background-color",
	fill: "fill-color",
	line: "line-color",
} as const;

type Layer = {
	id: string;
	type: string;
	paint?: Record<string, unknown>;
	layout?: Record<string, unknown>;
};

export function recolor<T extends { layers: Layer[] }>(
	style: T,
	patch: Record<string, string>,
): T {
	return {
		...style,
		layers: style.layers.map((layer) => {
			const color = patch[layer.id];
			const key = colorKey[layer.type as keyof typeof colorKey];
			if (!color || !key) return layer;
			return { ...layer, paint: { ...layer.paint, [key]: color } };
		}),
	};
}

// OpenFreeMap labels places in Latin script with the local name beside it ("Russia
// Россия"). On a page in Russian the map should say "Россия": the OpenMapTiles data
// carries name:<lang> for most places, and falls back to the old label where it does not.
export function localizeLabels<T extends { layers: Layer[] }>(
	style: T,
	lang: Lang,
): T {
	const { language } = new Intl.Locale(lang);
	const label = [
		"coalesce",
		["get", `name:${language}`],
		["get", "name:latin"],
		["get", "name"],
	];
	return {
		...style,
		layers: style.layers.map((layer) => {
			const field = JSON.stringify(layer.layout?.["text-field"] ?? null);
			if (layer.type !== "symbol" || !field.includes('"name')) return layer;
			return { ...layer, layout: { ...layer.layout, "text-field": label } };
		}),
	};
}

const cache = new Map<string, Promise<StyleSpecification | string>>();

export function loadMapStyle(
	scheme: Scheme,
	lang: Lang,
): Promise<StyleSpecification | string> {
	const key = `${scheme} ${lang}`;
	let pending = cache.get(key);
	if (!pending) {
		const url = mapStyles[scheme];
		pending = fetch(url)
			.then((response) => response.json() as Promise<StyleSpecification>)
			.then((style) =>
				localizeLabels(recolor(style, basemapPatches[scheme]), lang),
			)
			.catch(() => url);
		cache.set(key, pending);
	}
	return pending;
}
