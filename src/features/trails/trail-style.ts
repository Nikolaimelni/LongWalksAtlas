import type { TrailType } from "./trail-schema";

export const trailColors = {
	pilgrimage: "#d08a12",
	historic: "#a63d26",
	coastal: "#1f6fb8",
	mountain: "#4a9a3f",
	"e-path": "#7a4fbf",
} as const satisfies Record<TrailType, string>;
