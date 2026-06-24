import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useLang } from "~/features/i18n/use-lang";
import type { TrailContent } from "./content-schema";
import { TrailImage } from "./trail-image";
import type { TrailPhoto, TrailSummary } from "./trail-schema";
import { trailColors } from "./trail-style";
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
	const color = trailColors[trail.type];

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
			/>
			<div>
				<p className="flex items-center gap-2 text-xs font-medium tracking-wide text-stone-600 uppercase dark:text-stone-400">
					<span
						className="inline-block size-2.5 rounded-full"
						style={{ background: color }}
					/>
					{t(`trailType.${trail.type}`)}
				</p>
				<h2 className="mt-1 text-lg leading-snug font-semibold">
					{content?.title ?? trail.name.original}
				</h2>
				{content && content.title !== trail.name.original && (
					<p
						className="text-sm text-stone-500 italic"
						lang={trail.countries[0]?.toLowerCase()}
					>
						{trail.name.original}
					</p>
				)}
				<p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
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
					<dt className="text-stone-500">{t("trail.length")}</dt>
					<dd className="font-semibold">{format.km(trail.lengthKm)}</dd>
				</div>
				<div>
					<dt className="text-stone-500">{t("trail.duration")}</dt>
					<dd className="font-semibold">{format.days(trail.days)}</dd>
				</div>
			</dl>
			{variant === "sheet" && (
				<div className="flex items-center gap-2">
					<Link
						to={`/${lang}/trail/${trail.slug}/`}
						className="flex-1 rounded-full bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 dark:bg-stone-100 dark:text-stone-900"
					>
						{t("trail.more")}
					</Link>
					{onClose && (
						<button
							type="button"
							onClick={onClose}
							className="grid size-11 place-items-center rounded-full bg-stone-100 text-xl focus-visible:outline-2 focus-visible:outline-stone-900 dark:bg-stone-800"
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
