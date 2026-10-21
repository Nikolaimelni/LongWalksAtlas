import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CountryList } from "~/features/hubs/country-list";
import { useLang } from "~/features/i18n/use-lang";
import type { TrailContent } from "./content-schema";
import { TrailDot } from "./trail-dot";
import { TrailImage } from "./trail-image";
import type { TrailPhoto, TrailSummary } from "./trail-schema";
import { trailColor } from "./trail-style";
import { useTrailFormat } from "./use-trail-format";

type Props = {
	trail: TrailSummary;
	content: TrailContent | undefined;
	photo: TrailPhoto | null;
	variant: "sheet" | "hover";
};

export function TrailPreview({ trail, content, photo, variant }: Props) {
	const { t } = useTranslation();
	const lang = useLang();
	const format = useTrailFormat();
	const color = trailColor(trail.type);
	const page = `/${lang}/trail/${trail.slug}/`;

	return (
		<article className="flex flex-col gap-3">
			<TrailImage
				photo={photo}
				color={color}
				alt={t("trail.photoAlt", {
					title: content?.title ?? trail.name.original,
				})}
				className={
					variant === "sheet"
						? "aspect-[16/9] w-full rounded-xl md:aspect-[3/2]"
						: "aspect-[2/1] w-full rounded-lg"
				}
				sizes={
					variant === "sheet" ? "(min-width: 768px) 384px, 100vw" : "256px"
				}
				eager
				morph={variant === "sheet"}
				href={variant === "sheet" ? page : undefined}
			/>
			<div>
				<p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
					<TrailDot color={color} />
					{t(`trailType.${trail.type}`)}
				</p>
				<h2 className="mt-1 font-display text-lg leading-snug font-semibold">
					{content?.title ?? trail.name.original}
				</h2>
				{content && content.title !== trail.name.original && (
					<p className="text-sm text-muted italic">{trail.name.original}</p>
				)}
				<p className="mt-1 text-sm text-muted">
					<CountryList codes={trail.countries} linked={false} />
				</p>
			</div>
			{content && (
				<p
					className={
						variant === "hover"
							? "line-clamp-3 text-sm leading-relaxed"
							: "text-sm leading-relaxed"
					}
					lang={content.lang}
				>
					{content.summary}
				</p>
			)}
			<dl className="flex gap-6 text-sm">
				<div>
					<dt className="text-muted">{t("trail.length")}</dt>
					<dd className="font-semibold">{format.km(trail.lengthKm)}</dd>
				</div>
				<div>
					<dt className="text-muted">{t("trail.duration")}</dt>
					<dd className="font-semibold">{format.daysOf(trail)}</dd>
				</div>
			</dl>
			{variant === "sheet" && (
				<Link
					to={page}
					viewTransition
					className="rounded-full bg-brand px-4 py-3 text-center text-sm font-semibold text-on-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					{t("trail.more")}
				</Link>
			)}
		</article>
	);
}
