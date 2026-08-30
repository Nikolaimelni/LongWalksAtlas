import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useLang } from "~/features/i18n/use-lang";
import type { TrailContent } from "./content-schema";
import { TrailImage } from "./trail-image";
import type { TrailPhoto, TrailSummary } from "./trail-schema";
import { useTrailColors } from "./use-trail-colors";
import { useTrailFormat } from "./use-trail-format";

type Props = {
	trail: TrailSummary;
	content: TrailContent | undefined;
	photo: TrailPhoto | null;
	variant: "sheet" | "hover";
	onClose?: () => void;
};

export function TrailPreview({
	trail,
	content,
	photo,
	variant,
	onClose,
}: Props) {
	const { t } = useTranslation();
	const lang = useLang();
	const format = useTrailFormat();
	const color = useTrailColors()[trail.type];

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
						? "aspect-[5/2] w-full rounded-xl md:aspect-[16/9]"
						: "aspect-[2/1] w-full rounded-lg"
				}
				sizes={
					variant === "sheet" ? "(min-width: 768px) 384px, 100vw" : "256px"
				}
				eager
				morph={variant === "sheet"}
			/>
			<div>
				<p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
					<span
						className="inline-block size-2.5 rounded-full"
						style={{ background: color }}
					/>
					{t(`trailType.${trail.type}`)}
				</p>
				<h2 className="mt-1 font-serif text-lg leading-snug font-semibold">
					{content?.title ?? trail.name.original}
				</h2>
				{content && content.title !== trail.name.original && (
					<p
						className="text-sm text-muted italic"
						lang={trail.countries[0]?.toLowerCase()}
					>
						{trail.name.original}
					</p>
				)}
				<p className="mt-1 text-sm text-muted">
					{format.countries(trail.countries)}
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
					<dd className="font-semibold">{format.days(trail.days)}</dd>
				</div>
			</dl>
			{variant === "sheet" && (
				<p className="text-xs leading-snug text-muted">
					{t("disclaimer.short")}
				</p>
			)}
			{variant === "sheet" && (
				<div className="flex items-center gap-2">
					<Link
						to={`/${lang}/trail/${trail.slug}/`}
						viewTransition
						className="flex-1 rounded-full bg-brand px-4 py-3 text-center text-sm font-semibold text-on-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{t("trail.more")}
					</Link>
					{onClose && (
						<button
							type="button"
							onClick={onClose}
							className="grid size-11 place-items-center rounded-full bg-soft text-xl focus-visible:outline-2 focus-visible:outline-brand"
							aria-label={t("trail.close")}
						>
							<span aria-hidden="true">×</span>
						</button>
					)}
				</div>
			)}
		</article>
	);
}
