import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LanguageSwitcher } from "~/features/i18n/language-switcher";
import { useLang } from "~/features/i18n/use-lang";
import { TrailImage } from "~/features/trails/trail-image";
import { useTrailColors } from "~/features/trails/use-trail-colors";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import {
	breadcrumbNode,
	itemListNode,
	JsonLd,
	websiteNode,
} from "~/shared/json-ld";
import { absoluteUrl } from "~/shared/site";
import type { HubData } from "./hub-data";
import { HubLinks } from "./hub-links";
import { hubIntro, hubTitle } from "./hub-meta";
import { hubPath } from "./hubs";

type Props = { data: HubData };

export function HubPage({ data }: Props) {
	const { hub, trails, hubs } = data;
	const { t } = useTranslation();
	const lang = useLang();
	const format = useTrailFormat();
	const colors = useTrailColors();

	const title = hubTitle(t, lang, hub);
	const intro = hubIntro(
		t,
		lang,
		hub,
		trails.map((tr) => tr.summary),
	);
	const titleOf = (tr: HubData["trails"][number]) =>
		tr.content?.title ?? tr.summary.name.original;
	const pageOf = (slug: string) => `/${lang}/trail/${slug}/`;
	const onMap =
		hub.kind === "country"
			? `/${lang}/?country=${hub.code}`
			: `/${lang}/?type=${hub.type}`;

	const home = absoluteUrl(`/${lang}/`);
	const url = absoluteUrl(`/${lang}/${hubPath(hub)}`);
	const jsonLd = [
		{
			"@type": "CollectionPage",
			"@id": url,
			url,
			name: title,
			description: intro,
			inLanguage: lang,
			isPartOf: { "@id": `${home}#website` },
			breadcrumb: { "@id": `${url}#breadcrumb` },
			dateModified: data.checked,
			mainEntity: itemListNode(
				trails.map((tr) => ({
					name: titleOf(tr),
					url: absoluteUrl(pageOf(tr.summary.slug)),
				})),
			),
		},
		breadcrumbNode(`${url}#breadcrumb`, [
			{ name: t("app.name"), url: home },
			{ name: title, url },
		]),
		websiteNode(home, t("app.name"), lang),
	];

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

			<header className="mt-4">
				<h1 className="font-serif text-3xl leading-tight font-semibold">
					{title}
				</h1>
				<p className="mt-4 text-lg leading-relaxed">
					{intro} {t("hub.each")}
				</p>
				<Link
					to={onMap}
					viewTransition
					className="mt-3 inline-block text-sm font-medium underline"
				>
					{t("hub.showOnMap")}
				</Link>
			</header>

			<ul className="mt-8 flex flex-col gap-6">
				{trails.map((tr) => (
					<li key={tr.summary.slug}>
						<article className="flex gap-4">
							<div className="w-28 shrink-0 sm:w-40">
								<TrailImage
									photo={tr.photo}
									color={colors[tr.summary.type]}
									alt={t("trail.photoAlt", { title: titleOf(tr) })}
									className="aspect-[4/3] w-full rounded-xl"
									sizes="(min-width: 640px) 160px, 112px"
								/>
							</div>
							<div className="min-w-0">
								<p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
									<span
										className="inline-block size-2.5 shrink-0 rounded-full"
										style={{ background: colors[tr.summary.type] }}
									/>
									{t(`trailType.${tr.summary.type}`)}
								</p>
								<h2 className="mt-1 font-serif text-xl leading-snug font-semibold">
									<Link
										to={pageOf(tr.summary.slug)}
										viewTransition
										className="hover:underline"
									>
										{titleOf(tr)}
									</Link>
								</h2>
								<p className="mt-1 text-sm text-muted">
									{format.countries(tr.summary.countries)} ·{" "}
									{format.km(tr.summary.lengthKm)} ·{" "}
									{format.days(tr.summary.days)}
								</p>
								{tr.content && (
									<p
										className="mt-2 text-sm leading-relaxed"
										lang={tr.content.lang}
									>
										{tr.content.summary}
									</p>
								)}
							</div>
						</article>
					</li>
				))}
			</ul>

			<HubLinks
				hubs={hubs}
				current={hub}
				className="mt-10 border-t border-line pt-4"
			/>
			<JsonLd graph={jsonLd} />
		</main>
	);
}
