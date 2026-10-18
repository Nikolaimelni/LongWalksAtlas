import type { Scheme } from "~/features/trails/trail-style";

// The colours the app paints over OpenFreeMap's styles, by layer id. Kept apart from
// map-style.ts so code that only needs the colours does not pull in MapLibre.
export const basemapPatches = {
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
} as const satisfies Record<Scheme, Record<string, string>>;

// What a trail line is drawn on, read from the patches above: the contrast test holds
// every trail colour to these, and the dots on the atlas wear the land colour as a halo.
export const basemapColors = {
	light: {
		land: basemapPatches.light.background,
		water: basemapPatches.light.water,
		woods: basemapPatches.light.landcover_wood,
	},
	dark: {
		land: basemapPatches.dark.background,
		water: basemapPatches.dark.water,
		woods: basemapPatches.dark.landcover_wood,
	},
};
