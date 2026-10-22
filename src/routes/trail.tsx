import { lazy } from "react";
import { Trans, useTranslation } from "react-i18next";
import { data, Link } from "react-router";
import { hubTitle } from "~/features/hubs/hub-meta";
import { type Hub, hasHub, hubPath } from "~/features/hubs/hubs";
import { alternateLinks, localeMeta } from "~/features/i18n/alternates";
import { getI18n } from "~/features/i18n/i18n";
import { isLang } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import { MapSlot } from "~/features/map/map-slot";
import { loadContentBody, loadContentIndex } from "~/features/trails/content";
import { RelatedTrails } from "~/features/trails/related-trails";
import { textLanguages } from "~/features/trails/text-languages";
import { TrailCarousel } from "~/features/trails/trail-carousel";
import { TrailDot } from "~/features/trails/trail-dot";
import { TrailFacts } from "~/features/trails/trail-facts";
import { loadGallery, loadTrailFile } from "~/features/trails/trail-files";
import { TrailImage } from "~/features/trails/trail-image";
import { trailJsonLd } from "~/features/trails/trail-json-ld";
import { TrailNotes } from "~/features/trails/trail-notes";
import { trailColor } from "~/features/trails/trail-style";
import { photos, trailsIndex } from "~/features/trails/trails-index";
import {
	trailFormat,
	useTrailFormat,
} from "~/features/trails/use-trail-format";
import { JsonLd } from "~/shared/json-ld";
import { prerenderedOnly } from "~/shared/prerendered-only";
import { absoluteUrl } from "~/shared/site";
import { SiteFooter } from "~/shared/site-footer";
import { SiteNav } from "~/shared/site-nav";
import { atlasCardMeta, photoCardMeta } from "~/shared/social-cards";
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
	const gallery = await loadGallery(summary.slug);

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
		gallery,
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
		days: format.daysOf(summary),
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
	const { summary, file, content, body, photo, gallery, related } = loaderData;
	const { t } = useTranslation();
	const lang = useLang();
	const format = useTrailFormat();
	const color = trailColor(summary.type);
	const officialHost = new URL(file.officialUrl).hostname.replace(/^www\./, "");
	const typeHub: Hub = { kind: "type", type: summary.type };
	const typePage = hasHub(typeHub, trailsIndex)
		? { name: hubTitle(t, lang, typeHub), path: `/${lang}/${hubPath(typeHub)}` }
		: null;
	const hasRelated = related.crosses.length > 0 || related.nearby.length > 0;
	// The aside runs beside every block of the text column. A fixed span left an empty
	// row, and an extra gap, on trails without a story or related trails.
	const textRows = 3 + (body ? 1 : 0) + (hasRelated ? 1 : 0);

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
		countryNames: summary.countries.map(format.country),
	});

	// One column on a phone, in reading order. On a wide screen the map, the disclaimer
	// and the way to the official site stay in view beside the text.
	return (
		<main
			key={summary.slug}
			className="mx-auto max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10"
		>
			<SiteNav />

			<div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-x-12">
				<header className="lg:col-start-1">
					{photo && gallery.length > 0 ? (
						<TrailCarousel
							photos={[photo, ...gallery]}
							color={color}
							alt={t("trail.photoAlt", { title: content.title })}
						/>
					) : (
						<TrailImage
							photo={photo}
							color={color}
							alt={t("trail.photoAlt", { title: content.title })}
							className="aspect-[16/9] w-full rounded-2xl"
							sizes="(min-width: 1024px) 720px, 100vw"
							eager
							morph
						/>
					)}
					<p className="mt-5 flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
						<TrailDot color={color} />
						{typePage ? (
							<Link
								to={typePage.path}
								viewTransition
								className="hover:underline"
							>
								{t(`trailType.${summary.type}`)}
							</Link>
						) : (
							t(`trailType.${summary.type}`)
						)}
					</p>
					<h1 className="mt-1 font-display text-3xl leading-tight font-semibold text-balance lg:text-4xl">
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
					<p
						className="mt-4 text-lg leading-relaxed text-pretty"
						lang={content.lang}
					>
						{content.summary}
					</p>
				</header>

				<TrailFacts summary={summary} file={file} className="lg:col-start-1" />

				<aside
					className="flex flex-col gap-3 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-(--text-rows) lg:row-start-1 lg:self-start"
					style={{ "--text-rows": textRows } as React.CSSProperties}
				>
					<div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-soft lg:aspect-[4/5]">
						<MapSlot>
							<TrailMap
								trail={summary}
								start={file.start.coords}
								end={file.end.coords}
								startLabel={`${t("trail.start")}: ${file.start.name}`}
								endLabel={`${t("trail.end")}: ${file.end.name}`}
							/>
						</MapSlot>
					</div>
					<p className="rounded-xl bg-soft p-3 text-sm leading-relaxed text-ink">
						<Trans
							i18nKey="disclaimer.trail"
							values={{ site: officialHost }}
							components={{
								a: (
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
						className="text-sm font-medium underline"
					>
						{t("trail.showOnMap")}
					</Link>
					<a
						href={file.officialUrl}
						target="_blank"
						rel="noopener"
						className="mt-1 block rounded-full bg-brand px-4 py-3 text-center font-semibold text-on-brand hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{t("trail.officialSite")}
						<span aria-hidden="true"> {"↗︎"}</span>
					</a>
				</aside>

				{body && (
					<section aria-labelledby="story" className="lg:col-start-1">
						<h2 id="story" className="font-display text-xl font-semibold">
							{t("trail.story")}
						</h2>
						<div
							className="mt-3 max-w-prose leading-relaxed [&_a]:underline [&_p]:mb-4"
							lang={content.lang}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: scripts/build-content.ts holds every story to a short list of tags and link schemes and fails the build on anything else
							dangerouslySetInnerHTML={{ __html: body }}
						/>
					</section>
				)}

				<RelatedTrails related={related} className="lg:col-start-1" />

				<TrailNotes
					summary={summary}
					file={file}
					content={content}
					lang={lang}
					className="lg:col-start-1"
				/>
			</div>

			<SiteFooter />
			<JsonLd graph={jsonLd} />
		</main>
	);
}
