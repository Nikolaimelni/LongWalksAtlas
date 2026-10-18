import type { DayRange } from "./trail-schema.ts";

// When no source gives the days on foot, they are worked out from the length at this
// pace, and the page says so. Shared by the data build and the text that explains it.
export const kmPerDay = { slow: 20, fast: 25 } as const;

export function estimateDays(km: number): DayRange {
	return {
		min: Math.max(1, Math.round(km / kmPerDay.fast)),
		max: Math.max(1, Math.round(km / kmPerDay.slow)),
	};
}
