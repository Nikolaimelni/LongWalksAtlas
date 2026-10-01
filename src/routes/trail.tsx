import { lazy, Suspense } from "react";
import { Trans, useTranslation } from "react-i18next";
import { data, Link } from "react-router";
import { CountryList } from "~/features/hubs/country-list";
import { hubTitle } from "~/features/hubs/hub-meta";
import { type Hub, hasHub, hubPath } from "~/features/hubs/hubs";
import { alternateLinks, localeMeta } from "~/features/i18n/alternates";
import { getI18n } from "~/features/i18n/i18n";
import { LanguageSwitcher } from "~/features/i18n/language-switcher";
import { isLang } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import { loadContentBody, loadContentIndex } from "~/features/trails/content";
import { textLanguages } from "~/features/trails/text-languages";
import { loadTrailFile } from "~/features/trails/trail-files";
import { TrailImage } from "~/features/trails/trail-image";
import { trailJsonLd } from "~/features/trails/trail-json-ld";
import { photos, trailsIndex } from "~/features/trails/trails-index";
import { useTrailColors } from "~/features/trails/use-trail-colors";
import {
	trailFormat,
	useTrailFormat,
} from "~/features/trails/use-trail-format";
import { JsonLd } from "~/shared/json-ld";
import { prerenderedOnly } from "~/shared/prerendered-only";
import { absoluteUrl } from "~/shared/site";
import { atlasCardMeta, photoCardMeta } from "~/shared/social-cards";
import { useHydrated } from "~/shared/use-hydrated";
import type { Route } from "./+types/trail";

const TrailMap = lazy(() =>
	import("~/features/map/trail-map").then((m) => ({ default: m.TrailMap })),
);

export async function loader({ params }: Route.LoaderArgs) {
	const { lang, slug } = params;
	if (!isLang(lang)) throw data("Unknown language", { status: 404 });
	const summary = trailsIndex.find((t) => t.slug === slug);
	if (!summary) throw data("Unknown trail", { status: 404 });

	const file = await loadTrailFile(summary.slug);
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

	return {
		summary,
		file,
		content,
		body,
		photo,
		related,
		languages: await textLanguages(summary.slug),
	};
}

export const clientLoader = ({ serverLoader }: Route.ClientLoaderArgs) =>
	prerenderedOnly(serverLoader);

export function meta({ loaderData, params, matches }: Route.MetaArgs) {
	const layout = matches[1]?.loaderData;
	if (!loaderData || !layout) return [];
	const app = layout.messages.app.name;
	const { content, summary, photo, languages } = loaderData;
	const t = getI18n(layout.lang, layout.messages).getFixedT(layout.lang);
	const format = trailFormat(t, layout.lang);
	const facts = {
		km: format.km(summary.lengthKm),
		days: format.days(summary.days),
	};
	const description = t("seo.trailDescription", {
		summary: content.summary,
		...facts,
	});
	const url = absoluteUrl(`/${layout.lang}/trail/${summary.slug}/`);
	return [
		{
			title: `${t("seo.trailTitle", { title: content.title, ...facts })} · ${app}`,
		},
		{ name: "description", content: description },
		{ property: "og:type", content: "article" },
		{ property: "og:title", content: content.title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:site_name", content: app },
		...localeMeta(layout.lang),
		...(photo ? photoCardMeta(photo) : atlasCardMeta(layout.lang)),
		...(languages.includes(layout.lang)
			? []
			: [{ name: "robots", content: "noindex" }]),
		...alternateLinks(layout.lang, `trail/${params.slug}/`, {
			langs: languages,
		}),
	];
}

export default function Trail({ loaderData }: Route.ComponentProps) {
	const { summary, file, content, body, photo, related } = loaderData;
	const { t } = useTranslation();
	const lang = useLang();
	const hydrated = useHydrated();
	const format = useTrailFormat();
	const colors = useTrailColors();
	const color = colors[summary.type];
	const loop =
		file.start.coords[0] === file.end.coords[0] &&
		file.start.coords[1] === file.end.coords[1];
	const vars = { title: content.title };
	const officialHost = new URL(file.officialUrl).hostname.replace(/^www\./, "");
	const regions = new Intl.DisplayNames([lang], { type: "region" });
	const checkedOn = new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(
		new Date(file.verifiedAt),
	);
	const typeHub: Hub = { kind: "type", type: summary.type };
	const typePage = hasHub(typeHub, trailsIndex)
		? { name: hubTitle(t, lang, typeHub), path: `/${lang}/${hubPath(typeHub)}` }
		: null;

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
		...(summary.countries.length > 1
			? [
					{
						question: t("faq.countriesQ", vars),
						answer: t("faq.countriesA", {
							countries: format.countries(summary.countries),
						}),
					},
				]
			: []),
		{
			question: t("faq.officialQ", vars),
			answer: t("faq.officialA", { url: officialHost }),
		},
	];

	const jsonLd = trailJsonLd({
		summary,
		file,
		content,
		lang,
		url: absoluteUrl(`/${lang}/trail/${summary.slug}/`),
		site: { name: t("app.name"), url: absoluteUrl(`/${lang}/`) },
		parents: typePage
			? [{ name: typePage.name, url: absoluteUrl(typePage.path) }]
			: [],
		image: photo ? absoluteUrl(photo.src.large) : null,
		countryNames: summary.countries.map((c) => regions.of(c) ?? c),
		faq,
	});

	return (
		<main className="mx-auto max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-16">
			<nav className="flex items-center justify-between gap-2 py-2 text-sm">
				<Link
					to={`/${lang}/`}
					viewTransition
					className="rounded-full px-3 py-2 font-medium hover:bg-soft"
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
				<p className="mt-4 flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
					<span
						className="inline-block size-2.5 rounded-full"
						style={{ background: color }}
					/>
					{typePage ? (
						<Link to={typePage.path} viewTransition className="hover:underline">
							{t(`trailType.${summary.type}`)}
						</Link>
					) : (
						t(`trailType.${summary.type}`)
					)}
				</p>
				<h1 className="mt-1 font-serif text-3xl leading-tight font-semibold">
					{content.title}
				</h1>
				{content.title !== file.name.original && (
					<p className="mt-1 text-muted italic">{file.name.original}</p>
				)}
				{file.badges.length > 0 && (
					<ul className="mt-3 flex flex-wrap gap-2">
						{file.badges.map((badge) => (
							<li
								key={badge}
								className="rounded-full bg-soft px-3 py-1 text-xs font-medium"
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
						<dd className="font-semibold">{format.days(summary.days)}</dd>
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
				<div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-soft">
					{hydrated ? (
						<Suspense
							fallback={
								<p className="grid h-full place-items-center text-sm text-muted">
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
				<p className="mt-3 rounded-xl bg-soft p-3 text-sm leading-relaxed text-ink">
					<Trans
						i18nKey="disclaimer.trail"
						values={{ site: officialHost }}
						components={{
							link: (
								// biome-ignore lint/a11y/useAnchorContent: Trans fills the link with the site's name
								<a
									href={file.officialUrl}
									target="_blank"
									rel="noopener"
									className="font-medium underline"
								/>
							),
						}}
					/>
				</p>
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
						// biome-ignore lint/security/noDangerouslySetInnerHtml: scripts/build-content.ts holds every story to a short list of tags and link schemes and fails the build on anything else
						dangerouslySetInnerHTML={{ __html: body }}
					/>
				</section>
			)}

			<a
				href={file.officialUrl}
				target="_blank"
				rel="noopener"
				className="mt-6 block rounded-full bg-brand px-4 py-3 text-center font-semibold text-on-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
											className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 hover:bg-soft"
										>
											<span
												className="inline-block h-8 w-1 shrink-0 rounded-full"
												style={{ background: colors[other.type] }}
											/>
											<span>
												<span className="block font-medium">{other.title}</span>
												<span className="block text-sm text-muted">
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
							<dd className="mt-1 text-ink">{answer}</dd>
						</div>
					))}
				</dl>
			</section>

			<footer className="mt-10 border-t border-line pt-4 text-sm text-muted">
				{content.lang !== lang && <p>{t("trail.fallback")}</p>}
				{content.status === "machine" && <p>{t("trail.notReviewed")}</p>}
				{summary.lengthSource === "osm" && <p>{t("trail.lengthFromMap")}</p>}
				<h2 className="mt-3 font-semibold text-ink">{t("trail.sources")}</h2>
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

			<JsonLd graph={jsonLd} />
		</main>
	);
}
