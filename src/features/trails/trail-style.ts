import type { TrailType } from "./trail-schema";

export type Scheme = "light" | "dark";
export type TrailPalette = Record<TrailType, string>;

// Picked by search, not by eye: every pair stays apart for protan and deutan vision
// (OKLab ΔE ≥ 10 after the Machado 2009 simulation) and for everyone else (ΔE ≥ 15),
// at 3:1 against the land. A trail never needs it against water or woods, because
// trail-layers.tsx draws each line on a land-coloured casing.
export const trailPalettes = {
	light: {
		pilgrimage: "#b3317f",
		historic: "#be6609",
		coastal: "#2282cb",
		mountain: "#4d29c4",
		forest: "#026440",
	},
	dark: {
		pilgrimage: "#d057a7",
		historic: "#cd8b4b",
		coastal: "#44b0fe",
		mountain: "#826df2",
		forest: "#29d6bb",
	},
} as const satisfies Record<Scheme, TrailPalette>;

// The page draws trail colours through CSS custom properties, set from the palettes
// above in root.tsx. The prerendered HTML then already has the dark ones on a dark
// device; reading the scheme in JS meant the light ones until hydration. MapLibre
// cannot read CSS variables, so the map keeps using trailPalettes.
export function trailColor(type: TrailType): string {
	return `var(--trail-${type})`;
}

export function trailColorCss(): string {
	const vars = (scheme: Scheme) =>
		Object.entries(trailPalettes[scheme])
			.map(([type, color]) => `--trail-${type}:${color}`)
			.join(";");
	return `:root{${vars("light")}}@media (prefers-color-scheme:dark){:root{${vars("dark")}}}`;
}
