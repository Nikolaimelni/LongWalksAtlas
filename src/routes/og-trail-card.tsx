import { useTranslation } from "react-i18next";
import { data } from "react-router";
import { isLang } from "~/features/i18n/languages";
import { loadContentIndex } from "~/features/trails/content";
import { photos, trailsIndex } from "~/features/trails/trails-index";
import { useTrailColors } from "~/features/trails/use-trail-colors";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { LogoMark } from "~/shared/logo-mark";
import { prerenderedOnly } from "~/shared/prerendered-only";
import type { Route } from "./+types/og-trail-card";

export async function loader({ params }: Route.LoaderArgs) {
	if (!isLang(params.lang)) throw data("Unknown language", { status: 404 });
	const summary = trailsIndex.find((t) => t.slug === params.slug);
	if (!summary) throw data("Unknown trail", { status: 404 });
	const content = (await loadContentIndex(params.lang))[summary.slug];
	return {
		summary,
		title: content?.title ?? summary.name.original,
		photo: photos[summary.slug] ?? null,
	};
}

export const clientLoader = ({ serverLoader }: Route.ClientLoaderArgs) =>
	prerenderedOnly(serverLoader);

export function meta() {
	return [{ name: "robots", content: "noindex" }];
}

// A 1200 × 630 page that scripts/build-og.ts photographs into the trail's social card.
export default function OgTrailCard({ loaderData }: Route.ComponentProps) {
	const { summary, title, photo } = loaderData;
	const { t } = useTranslation();
	const format = useTrailFormat();
	const color = useTrailColors()[summary.type];
	return (
		<main className="relative h-[630px] w-[1200px] overflow-hidden bg-canvas">
			{photo ? (
				<img
					src={photo.src.large}
					alt=""
					className="absolute inset-0 size-full object-cover"
				/>
			) : (
				<div
					className="absolute inset-0"
					style={{
						background: `linear-gradient(135deg, ${color}, ${color}66)`,
					}}
				/>
			)}
			<div className="absolute inset-y-0 start-0 flex w-[660px] flex-col justify-between bg-gradient-to-r from-canvas via-canvas/95 to-canvas/0 p-14 pe-32">
				<p className="flex items-center gap-3 font-serif text-2xl font-semibold text-ink">
					<LogoMark className="size-10 text-brand" />
					{t("app.name")}
				</p>
				<div>
					<p className="flex items-center gap-2.5 text-lg font-medium tracking-wide text-muted uppercase">
						<span
							className="inline-block size-3.5 rounded-full"
							style={{ background: color }}
						/>
						{t(`trailType.${summary.type}`)}
					</p>
					<p className="mt-3 line-clamp-3 font-serif text-5xl leading-tight font-semibold text-ink">
						{title}
					</p>
					{title !== summary.name.original && (
						<p className="mt-2 truncate text-2xl text-muted italic">
							{summary.name.original}
						</p>
					)}
					<p className="mt-6 text-3xl font-semibold text-brand">
						{format.km(summary.lengthKm)} · {format.days(summary.days)}
					</p>
					<p className="mt-2 line-clamp-2 text-xl text-ink">
						{format.countries(summary.countries)}
					</p>
				</div>
				<p className="text-xl text-muted">longwalksatlas.com</p>
			</div>
			{photo && (
				<p className="absolute end-3 bottom-2 max-w-[500px] truncate rounded bg-surface/85 px-2 py-0.5 text-xs text-muted">
					{t("trail.photoBy")} {photo.author}, {photo.license}
				</p>
			)}
		</main>
	);
}
