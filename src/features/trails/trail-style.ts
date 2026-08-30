import type { TrailType } from "./trail-schema";

export type Scheme = "light" | "dark";
export type TrailPalette = Record<TrailType, string>;

export const trailPalettes = {
	light: {
		pilgrimage: "#9a6100",
		historic: "#a63d26",
		coastal: "#1f6fb8",
		mountain: "#3a7a30",
		"e-path": "#7a4fbf",
	},
	dark: {
		pilgrimage: "#f2b441",
		historic: "#f0846a",
		coastal: "#62aef2",
		mountain: "#86cf74",
		"e-path": "#b995f5",
	},
} as const satisfies Record<Scheme, TrailPalette>;

export const basemapColors = {
	light: { land: "#f6f1e6", water: "#bcd9e6", woods: "#d9e6cc" },
	dark: { land: "#151b22", water: "#0e1d2a", woods: "#18241f" },
} as const satisfies Record<Scheme, Record<"land" | "water" | "woods", string>>;
