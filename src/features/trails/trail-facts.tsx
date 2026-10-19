import { useTranslation } from "react-i18next";
import { CountryList } from "~/features/hubs/country-list";
import type { TrailFile, TrailSummary } from "./trail-schema";
import { useTrailFormat } from "./use-trail-format";

type Props = { summary: TrailSummary; file: TrailFile };

export function TrailFacts({ summary, file }: Props) {
	const { t } = useTranslation();
	const format = useTrailFormat();
	const loop =
		file.start.coords[0] === file.end.coords[0] &&
		file.start.coords[1] === file.end.coords[1];

	return (
		<section aria-labelledby="facts">
			<h2 id="facts" className="font-display text-xl font-semibold">
				{t("trail.facts")}
			</h2>
			<dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
				{loop ? (
					<div className="col-span-2 sm:col-span-1">
						<dt className="text-muted">{t("trail.loop")}</dt>
						<dd className="font-semibold">{file.start.name}</dd>
					</div>
				) : (
					<>
						<div>
							<dt className="text-muted">{t("trail.start")}</dt>
							<dd className="font-semibold">{file.start.name}</dd>
						</div>
						<div>
							<dt className="text-muted">{t("trail.end")}</dt>
							<dd className="font-semibold">{file.end.name}</dd>
						</div>
					</>
				)}
				<div>
					<dt className="text-muted">{t("trail.length")}</dt>
					<dd className="font-semibold">{format.km(summary.lengthKm)}</dd>
				</div>
				<div>
					<dt className="text-muted">{t("trail.duration")}</dt>
					<dd className="font-semibold">{format.daysOf(summary)}</dd>
				</div>
				<div>
					<dt className="text-muted">{t("trail.countries")}</dt>
					<dd className="font-semibold">
						<CountryList codes={summary.countries} />
					</dd>
				</div>
				{summary.bestSeason.length > 0 && (
					<div>
						<dt className="text-muted">{t("trail.season")}</dt>
						<dd className="font-semibold">
							{format.months(summary.bestSeason)}
						</dd>
					</div>
				)}
			</dl>
		</section>
	);
}
