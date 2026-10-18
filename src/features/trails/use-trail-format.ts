import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { Lang } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import regions from "~/generated/content/regions.json";
import { kmPerDay } from "./day-estimate";
import type { DayRange, TrailFile, TrailSummary } from "./trail-schema";

const monthIndex = {
	jan: 0,
	feb: 1,
	mar: 2,
	apr: 3,
	may: 4,
	jun: 5,
	jul: 6,
	aug: 7,
	sep: 8,
	oct: 9,
	nov: 10,
	dec: 11,
} as const satisfies Record<TrailFile["bestSeason"][number], number>;

// Written by scripts/build-content.ts, so the prerendered page and the browser agree.
const regionNames: Record<string, Record<string, string> | undefined> = regions;

// Consecutive months as [first, last] pairs. A run over the new year (Nov–Feb, the
// southern summer) is one run, not "January–February and November–December".
export function monthRuns(months: readonly number[]): [number, number][] {
	const sorted = [...new Set(months)].sort((a, b) => a - b);
	const runs: [number, number][] = [];
	for (const month of sorted) {
		const last = runs.at(-1);
		if (last && month === last[1] + 1) last[1] = month;
		else runs.push([month, month]);
	}
	const first = runs[0];
	const last = runs.at(-1);
	if (runs.length > 1 && first && last && first[0] === 0 && last[1] === 11) {
		runs.pop();
		runs[0] = [last[0], first[1]];
	}
	return runs;
}

export type TrailFormat = ReturnType<typeof trailFormat>;

// Also called from route meta functions, which run outside React and have no hooks.
export function trailFormat(t: TFunction, lang: Lang) {
	const names = regionNames[lang] ?? {};
	const country = (code: string) => names[code] ?? code;
	const list = new Intl.ListFormat(lang, { type: "conjunction" });
	const kmFormat = new Intl.NumberFormat(lang, {
		style: "unit",
		unit: "kilometer",
		maximumFractionDigits: 0,
	});
	const monthFormat = new Intl.DateTimeFormat(lang, { month: "long" });
	const days = ({ min, max }: DayRange) =>
		min === max
			? t("trail.days", { count: max })
			: t("trail.daysRange", { count: max, min });

	return {
		km: (value: number) => kmFormat.format(value),
		days,
		daysOf: (trail: Pick<TrailSummary, "days" | "daysSource">) =>
			trail.daysSource === "estimate"
				? `≈\u00a0${days(trail.days)}`
				: days(trail.days),
		pace: kmFormat.formatRange(kmPerDay.slow, kmPerDay.fast),
		country,
		countries: (codes: readonly string[]) => list.format(codes.map(country)),
		months: (codes: readonly TrailFile["bestSeason"][number][]) => {
			const name = (month: number) =>
				monthFormat.format(new Date(Date.UTC(2026, month, 15)));
			return list.format(
				monthRuns(codes.map((m) => monthIndex[m])).map(([from, to]) =>
					from === to ? name(from) : `${name(from)}–${name(to)}`,
				),
			);
		},
	};
}

export function useTrailFormat(): TrailFormat {
	const { t } = useTranslation();
	return trailFormat(t, useLang());
}
