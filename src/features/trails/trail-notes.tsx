import { useTranslation } from "react-i18next";
import type { Lang } from "~/features/i18n/languages";
import type { TrailContent } from "./content-schema";
import type { TrailFile, TrailSummary } from "./trail-schema";
import { useTrailFormat } from "./use-trail-format";

type Props = {
	summary: TrailSummary;
	file: TrailFile;
	content: TrailContent;
	lang: Lang;
	className?: string;
};

export function TrailNotes({
	summary,
	file,
	content,
	lang,
	className = "",
}: Props) {
	const { t } = useTranslation();
	const format = useTrailFormat();
	return (
		<section
			aria-labelledby="sources"
			className={`border-t border-line pt-4 text-sm text-muted ${className}`}
		>
			{content.lang !== lang && <p>{t("trail.fallback")}</p>}
			{summary.lengthSource === "osm" && <p>{t("trail.lengthFromMap")}</p>}
			{summary.daysSource === "estimate" && (
				<p>{t("trail.daysEstimated", { pace: format.pace })}</p>
			)}
			<h2 id="sources" className="mt-3 font-semibold text-ink first:mt-0">
				{t("trail.sources")}
			</h2>
			<ul className="mt-1 flex flex-col gap-1 break-all">
				{file.sources.map((source) => (
					<li key={source}>
						<a href={source} className="underline">
							{source}
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
