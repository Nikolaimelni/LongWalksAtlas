import type { StyleSpecification } from "maplibre-gl";
import type { Scheme } from "~/features/trails/trail-style";
import { mapStyles } from "./map-setup";

export const basemapPatches: Record<Scheme, Record<string, string>> = {
	light: {
		background: "#f6f1e6",
		road_area_pier: "#f6f1e6",
		water: "#bcd9e6",
		waterway: "#a9cddd",
		park: "#e1ebd3",
		landcover_wood: "#d9e6cc",
		landuse_residential: "#efe8da",
		building: "#ebe3d3",
		boundary_2: "#c4b8a3",
		boundary_3: "#d3c9b6",
		boundary_disputed: "#c4b8a3",
	},
	dark: {
		background: "#151b22",
		road_area_pier: "#151b22",
		water: "#0e1d2a",
		waterway: "#0e1d2a",
		landuse_park: "#18241f",
		landcover_wood: "#18241f",
		landuse_residential: "#19202a",
		building: "#1b222b",
		highway_minor: "#1f2731",
		boundary_state: "#2c3846",
		"boundary_country_z0-4": "#33404d",
		"boundary_country_z5-": "#33404d",
	},
};

const colorKey = {
	background: "background-color",
	fill: "fill-color",
	line: "line-color",
} as const;

type Layer = { id: string; type: string; paint?: Record<string, unknown> };

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

const cache = new Map<Scheme, Promise<StyleSpecification | string>>();

export function loadMapStyle(
	scheme: Scheme,
): Promise<StyleSpecification | string> {
	let pending = cache.get(scheme);
	if (!pending) {
		const url = mapStyles[scheme];
		pending = fetch(url)
			.then((response) => response.json() as Promise<StyleSpecification>)
			.then((style) => recolor(style, basemapPatches[scheme]))
			.catch(() => url);
		cache.set(scheme, pending);
	}
	return pending;
}
