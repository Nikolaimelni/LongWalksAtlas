import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { Lang } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import type { DayRange, TrailFile } from "./trail-schema";

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

export type TrailFormat = ReturnType<typeof trailFormat>;

// Also called from route meta functions, which run outside React and have no hooks.
export function trailFormat(t: TFunction, lang: Lang) {
	const regions = new Intl.DisplayNames([lang], { type: "region" });
	const list = new Intl.ListFormat(lang, { type: "conjunction" });
	const kmFormat = new Intl.NumberFormat(lang, {
		style: "unit",
		unit: "kilometer",
		maximumFractionDigits: 0,
	});
	const monthFormat = new Intl.DateTimeFormat(lang, { month: "long" });

	return {
		km: (value: number) => kmFormat.format(value),
		days: ({ min, max }: DayRange) =>
			min === max
				? t("trail.days", { count: max })
				: t("trail.daysRange", { count: max, min }),
		country: (code: string) => regions.of(code) ?? code,
		countries: (codes: readonly string[]) =>
			list.format(codes.map((c) => regions.of(c) ?? c)),
		months: (codes: readonly TrailFile["bestSeason"][number][]) =>
			list.format(
				codes.map((m) =>
					monthFormat.format(new Date(Date.UTC(2026, monthIndex[m], 15))),
				),
			),
	};
}

export function useTrailFormat(): TrailFormat {
	const { t } = useTranslation();
	return trailFormat(t, useLang());
}
