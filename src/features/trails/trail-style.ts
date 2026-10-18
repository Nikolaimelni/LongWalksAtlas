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

// The page draws trail colours through CSS custom properties, set from the palettes
// above in root.tsx. The prerendered HTML then already has the dark ones on a dark
// device; reading the scheme in JS meant the light ones until hydration. MapLibre
// cannot read CSS variables, so the map keeps using trailPalettes.
export function trailColor(type: TrailType): string {
	return `var(--trail-${type})`;
}

export function trailTint(type: TrailType, percent: number): string {
	return `color-mix(in srgb, ${trailColor(type)} ${percent}%, transparent)`;
}

export function trailColorCss(): string {
	const vars = (scheme: Scheme) =>
		Object.entries(trailPalettes[scheme])
			.map(([type, color]) => `--trail-${type}:${color}`)
			.join(";");
	return `:root{${vars("light")}}@media (prefers-color-scheme:dark){:root{${vars("dark")}}}`;
}
