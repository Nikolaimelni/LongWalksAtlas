import type { FeatureCollection } from "geojson";

export const mapStyles = {
	light: "https://tiles.openfreemap.org/styles/positron",
	dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

export const trailLinesUrl = "/data/trails.geojson";

const glyphs = (font: string) =>
	`https://tiles.openfreemap.org/fonts/${encodeURIComponent(font)}/0-255.pbf`;
export const basemapFirstRequests: {
	href: string;
	scheme?: "light" | "dark";
}[] = [
	{ href: "https://tiles.openfreemap.org/planet" },
	{ href: glyphs("Noto Sans Bold"), scheme: "light" },
	{ href: glyphs("Noto Sans Italic"), scheme: "light" },
	{ href: glyphs("Noto Sans Regular"), scheme: "dark" },
];

let trailLines: Promise<FeatureCollection | string> | null = null;

export function loadTrailLines(): Promise<FeatureCollection | string> {
	trailLines ??= fetch(trailLinesUrl)
		.then((response) => {
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.json() as Promise<FeatureCollection>;
		})
		.catch(() => trailLinesUrl);
	return trailLines;
}
