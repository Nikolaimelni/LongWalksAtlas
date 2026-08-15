import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { data, Link } from "react-router";
import { alternateLinks } from "~/features/i18n/alternates";
import { LanguageSwitcher } from "~/features/i18n/language-switcher";
import { isLang } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import { loadContentBody, loadContentIndex } from "~/features/trails/content";
import { TrailImage } from "~/features/trails/trail-image";
import { serializeJsonLd, trailJsonLd } from "~/features/trails/trail-json-ld";
import { trailFileSchema } from "~/features/trails/trail-schema";
import { trailColors } from "~/features/trails/trail-style";
import { photos, trailsIndex } from "~/features/trails/trails-index";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { prerenderedOnly } from "~/shared/prerendered-only";
import { absoluteUrl } from "~/shared/site";
import { useHydrated } from "~/shared/use-hydrated";
import type { Route } from "./+types/trail";

const TrailMap = lazy(() =>
	import("~/features/map/trail-map").then((m) => ({ default: m.TrailMap })),
);

const trailFiles = import.meta.glob<unknown>("../../data/trails/*.json", {
	import: "default",
});

export async function loader({ params }: Route.LoaderArgs) {
	const { lang, slug } = params;
	if (!isLang(lang)) throw data("Unknown language", { status: 404 });
	const summary = trailsIndex.find((t) => t.slug === slug);
	if (!summary) throw data("Unknown trail", { status: 404 });

	const file = trailFileSchema.parse(
		await trailFiles[`../../data/trails/${summary.slug}.json`]?.(),
	);
	const contentIndex = await loadContentIndex(lang);
	const content = contentIndex[summary.slug];
	if (!content) throw data("No text for this trail", { status: 404 });
	const body = await loadContentBody(lang, summary.slug);

	const photo = photos[summary.slug] ?? null;

	const neighbour = (slug: string) => {
		const other = trailsIndex.find((t) => t.slug === slug);
		return other
			? [
					{
						slug,
						type: other.type,
						lengthKm: other.lengthKm,
						title: contentIndex[slug]?.title ?? other.name.original,
					},
				]
			: [];
	};
	const related = {
		crosses: summary.crosses.flatMap(neighbour),
		nearby: summary.nearby.flatMap(neighbour),
	};

	return { summary, file, content, body, photo, related };
}

export const clientLoader = ({ serverLoader }: Route.ClientLoaderArgs) =>
	prerenderedOnly(serverLoader);

export function meta({ loaderData, params, matches }: Route.MetaArgs) {
	const layout = matches[1]?.loaderData;
	if (!loaderData || !layout) return [];
	const app = layout.messages.app.name;
	const { content, summary, photo } = loaderData;
	const url = absoluteUrl(`/${layout.lang}/trail/${summary.slug}/`);
	const image = photo
		? [
				{ property: "og:image", content: absoluteUrl(photo.src.large) },
				{ property: "og:image:width", content: String(photo.width) },
				{ property: "og:image:height", content: String(photo.height) },
				{ name: "twitter:card", content: "summary_large_image" },
			]
		: [{ name: "twitter:card", content: "summary" }];
	return [
		{ title: `${content.title} · ${app}` },
		{ name: "description", content: content.summary },
		{ property: "og:type", content: "article" },
		{ property: "og:title", content: content.title },
		{ property: "og:description", content: content.summary },
		{ property: "og:url", content: url },
		{ property: "og:site_name", content: app },
		{ property: "og:locale", content: layout.lang.replace("-", "_") },
		...image,
		...alternateLinks(layout.lang, `trail/${params.slug}/`),
	];
}

export default function Trail({ loaderData }: Route.ComponentProps) {
	const { summary, file, content, body, photo, related } = loaderData;
	const { t } = useTranslation();
	const lang = useLang();
	const hydrated = useHydrated();
	const format = useTrailFormat();
	const color = trailColors[summary.type];
	const loop =
		file.start.coords[0] === file.end.coords[0] &&
		file.start.coords[1] === file.end.coords[1];
	const vars = { title: content.title };
	const regions = new Intl.DisplayNames([lang], { type: "region" });
	const checkedOn = new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(
		new Date(file.verifiedAt),
	);

	const faq = [
		{
			question: t("faq.lengthQ", vars),
			answer: t("faq.lengthA", { ...vars, km: format.km(summary.lengthKm) }),
		},
		{
			question: t("faq.daysQ", vars),
			answer: t("faq.daysA", { ...vars, days: format.days(summary.days) }),
		},
		{
			question: t("faq.whereQ", vars),
			answer: loop
				? t("faq.whereLoopA", { start: file.start.name })
				: t("faq.whereA", { start: file.start.name, end: file.end.name }),
		},
		...(summary.bestSeason.length > 0
			? [
					{
						question: t("faq.whenQ", vars),
						answer: t("faq.whenA", {
							months: format.months(summary.bestSeason),
						}),
					},
				]
			: []),
		{
			question: t("faq.officialQ", vars),
			answer: t("faq.officialA", {
				url: new URL(file.officialUrl).hostname.replace(/^www\./, ""),
			}),
		},
	];

	const jsonLd = trailJsonLd({
		summary,
		file,
		content,
		url: absoluteUrl(`/${lang}/trail/${summary.slug}/`),
		atlas: { name: t("app.name"), url: absoluteUrl(`/${lang}/`) },
		countryNames: summary.countries.map((c) => regions.of(c) ?? c),
		faq,
	});

	return (
		<main className="mx-auto max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-16">
			<nav className="flex items-center justify-between gap-2 py-2 text-sm">
				<Link
					to={`/${lang}/`}
					viewTransition
					className="rounded-full px-3 py-2 font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
				>
					<span aria-hidden="true">← </span>
					{t("trail.backToAtlas")}
				</Link>
				<LanguageSwitcher />
			</nav>

			<header className="mt-2">
				<TrailImage
					photo={photo}
					color={color}
					alt={t("trail.photoAlt", { title: content.title })}
					className="aspect-[16/9] w-full rounded-2xl"
					sizes="(min-width: 672px) 640px, 100vw"
					eager
					morph
				/>
				<p className="mt-4 flex items-center gap-2 text-xs font-medium tracking-wide text-stone-600 uppercase dark:text-stone-400">
					<span
						className="inline-block size-2.5 rounded-full"
						style={{ background: color }}
					/>
					{t(`trailType.${summary.type}`)}
				</p>
				<h1 className="mt-1 font-serif text-3xl leading-tight font-semibold">
					{content.title}
				</h1>
				{content.title !== file.name.original && (
					<p className="mt-1 text-stone-500 italic">{file.name.original}</p>
				)}
				{file.badges.length > 0 && (
					<ul className="mt-3 flex flex-wrap gap-2">
						{file.badges.map((badge) => (
							<li
								key={badge}
								className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium dark:bg-stone-800"
							>
								{t(`badge.${badge}`)}
							</li>
						))}
					</ul>
				)}
				<p className="mt-4 text-lg leading-relaxed" lang={content.lang}>
					{content.summary}
				</p>
			</header>

			<section aria-labelledby="facts" className="mt-8">
				<h2 id="facts" className="font-serif text-xl font-semibold">
					{t("trail.facts")}
				</h2>
				<dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
					{loop ? (
						<div className="col-span-2 sm:col-span-1">
							<dt className="text-stone-500">{t("trail.loop")}</dt>
							<dd className="font-semibold">{file.start.name}</dd>
						</div>
					) : (
						<>
							<div>
								<dt className="text-stone-500">{t("trail.start")}</dt>
								<dd className="font-semibold">{file.start.name}</dd>
							</div>
							<div>
								<dt className="text-stone-500">{t("trail.end")}</dt>
								<dd className="font-semibold">{file.end.name}</dd>
							</div>
						</>
					)}
					<div>
						<dt className="text-stone-500">{t("trail.length")}</dt>
						<dd className="font-semibold">{format.km(summary.lengthKm)}</dd>
					</div>
					<div>
						<dt className="text-stone-500">{t("trail.duration")}</dt>
						<dd className="font-semibold">{format.days(summary.days)}</dd>
					</div>
					<div>
						<dt className="text-stone-500">{t("trail.countries")}</dt>
						<dd className="font-semibold">
							{format.countries(summary.countries)}
						</dd>
					</div>
					{summary.bestSeason.length > 0 && (
						<div>
							<dt className="text-stone-500">{t("trail.season")}</dt>
							<dd className="font-semibold">
								{format.months(summary.bestSeason)}
							</dd>
						</div>
					)}
				</dl>
				<div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-900">
					{hydrated ? (
						<Suspense
							fallback={
								<p className="grid h-full place-items-center text-sm text-stone-500">
									{t("trail.mapLoading")}
								</p>
							}
						>
							<TrailMap
								trail={summary}
								start={file.start.coords}
								end={file.end.coords}
								startLabel={`${t("trail.start")}: ${file.start.name}`}
								endLabel={`${t("trail.end")}: ${file.end.name}`}
							/>
						</Suspense>
					) : null}
				</div>
				<Link
					to={`/${lang}/?trail=${summary.slug}`}
					viewTransition
					className="mt-2 inline-block text-sm font-medium underline"
				>
					{t("trail.showOnMap")}
				</Link>
			</section>

			{body && (
				<section aria-labelledby="story" className="mt-8">
					<h2 id="story" className="font-serif text-xl font-semibold">
						{t("trail.story")}
					</h2>
					<div
						className="mt-3 leading-relaxed [&_a]:underline [&_p]:mb-4"
						lang={content.lang}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: built by scripts/build-content.ts from markdown in this repository; nothing a visitor types reaches it
						dangerouslySetInnerHTML={{ __html: body }}
					/>
				</section>
			)}

			<a
				href={file.officialUrl}
				target="_blank"
				rel="noopener"
				className="mt-6 block rounded-full bg-stone-900 px-4 py-3 text-center font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 dark:bg-stone-100 dark:text-stone-900"
			>
				{t("trail.officialSite")}
				<span aria-hidden="true"> {"↗︎"}</span>
			</a>

			{(["crosses", "nearby"] as const).map(
				(kind) =>
					related[kind].length > 0 && (
						<section key={kind} aria-labelledby={kind} className="mt-10">
							<h2 id={kind} className="font-serif text-xl font-semibold">
								{t(`trail.${kind}`)}
							</h2>
							<ul className="mt-3 flex flex-col gap-2">
								{related[kind].map((other) => (
									<li key={other.slug}>
										<Link
											to={`/${lang}/trail/${other.slug}/`}
											viewTransition
											className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"
										>
											<span
												className="inline-block h-8 w-1 shrink-0 rounded-full"
												style={{ background: trailColors[other.type] }}
											/>
											<span>
												<span className="block font-medium">{other.title}</span>
												<span className="block text-sm text-stone-500">
													{t(`trailType.${other.type}`)} ·{" "}
													{format.km(other.lengthKm)}
												</span>
											</span>
										</Link>
									</li>
								))}
							</ul>
						</section>
					),
			)}

			<section aria-labelledby="faq" className="mt-10">
				<h2 id="faq" className="font-serif text-xl font-semibold">
					{t("faq.title")}
				</h2>
				<dl className="mt-3 flex flex-col gap-4">
					{faq.map(({ question, answer }) => (
						<div key={question}>
							<dt className="font-semibold">{question}</dt>
							<dd className="mt-1 text-stone-700 dark:text-stone-300">
								{answer}
							</dd>
						</div>
					))}
				</dl>
			</section>

			<footer className="mt-10 border-t border-stone-200 pt-4 text-sm text-stone-500 dark:border-stone-800">
				{content.lang !== lang && <p>{t("trail.fallback")}</p>}
				{content.status === "machine" && <p>{t("trail.notReviewed")}</p>}
				{summary.lengthSource === "osm" && <p>{t("trail.lengthFromMap")}</p>}
				<h2 className="mt-3 font-semibold text-stone-700 dark:text-stone-300">
					{t("trail.sources")}
				</h2>
				<ul className="mt-1 flex flex-col gap-1 break-all">
					{file.sources.map((source) => (
						<li key={source}>
							<a href={source} rel="noopener" className="underline">
								{source}
							</a>
						</li>
					))}
				</ul>
				<p className="mt-3">{t("trail.checked", { date: checkedOn })}</p>
				<p>{t("trail.osm")}</p>
			</footer>

			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes "<", so no string in the data can end this tag
				dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
			/>
		</main>
	);
}
