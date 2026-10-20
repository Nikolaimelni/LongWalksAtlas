import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { data, useLocation, useNavigate, useSearchParams } from "react-router";
import { HoverCard } from "~/features/atlas/hover-card";
import { TrailSheet } from "~/features/atlas/trail-sheet";
import {
	applyFilters,
	countActive,
	emptyFilters,
	parseFilters,
	writeFilters,
} from "~/features/filters/filters";
import { createSearch } from "~/features/filters/search";
import { TrailPanel } from "~/features/filters/trail-panel";
import { alternateLinks, localeMeta } from "~/features/i18n/alternates";
import { LanguageSwitcher } from "~/features/i18n/language-switcher";
import { isLang } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import type { HoverInfo } from "~/features/map/atlas-map";
import { MapBoundary } from "~/features/map/map-boundary";
import {
	basemapFirstRequests,
	loadTrailLines,
	mapStyles,
	trailLinesUrl,
} from "~/features/map/map-sources";
import { loadContentIndex } from "~/features/trails/content";
import { TrailPreview } from "~/features/trails/trail-preview";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailColor } from "~/features/trails/trail-style";
import { photos, trailsIndex } from "~/features/trails/trails-index";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { canHover } from "~/shared/can-hover";
import { itemListNode, JsonLd, websiteNode } from "~/shared/json-ld";
import { LogoMark } from "~/shared/logo-mark";
import { prerenderedOnly } from "~/shared/prerendered-only";
import { revalidateOnPathChange } from "~/shared/same-path";
import { absoluteUrl } from "~/shared/site";
import { atlasCardMeta } from "~/shared/social-cards";
import { useHydrated } from "~/shared/use-hydrated";
import type { Route } from "./+types/atlas";

const loadAtlasMap = () => import("~/features/map/atlas-map");
const atlasMap = typeof document === "undefined" ? null : loadAtlasMap();
if (typeof document !== "undefined") void loadTrailLines();

const AtlasMap = lazy(() =>
	(atlasMap ?? loadAtlasMap()).then((m) => ({ default: m.AtlasMap })),
);

export const links: Route.LinksFunction = () => [
	{
		rel: "preconnect",
		href: new URL(mapStyles.light).origin,
		crossOrigin: "anonymous",
	},
	...(["light", "dark"] as const).map((scheme) => ({
		rel: "preload",
		as: "fetch",
		href: mapStyles[scheme],
		crossOrigin: "anonymous" as const,
		media: `(prefers-color-scheme: ${scheme})`,
	})),
	{
		rel: "preload",
		as: "fetch",
		href: trailLinesUrl,
		crossOrigin: "anonymous",
	},
	...basemapFirstRequests.map(({ href, scheme }) => ({
		rel: "preload",
		as: "fetch",
		href,
		crossOrigin: "anonymous" as const,
		...(scheme ? { media: `(prefers-color-scheme: ${scheme})` } : {}),
	})),
];

export async function loader({ params }: Route.LoaderArgs) {
	if (!isLang(params.lang)) throw data("Unknown language", { status: 404 });
	return { content: await loadContentIndex(params.lang) };
}

export const clientLoader = ({ serverLoader }: Route.ClientLoaderArgs) =>
	prerenderedOnly(serverLoader);

export const shouldRevalidate = revalidateOnPathChange;

export function meta({ matches }: Route.MetaArgs) {
	const layout = matches[1]?.loaderData;
	if (!layout) return [];
	const { app, atlas } = layout.messages;
	return [
		{ title: `${atlas.title} · ${app.name}` },
		{ name: "description", content: app.description },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: app.name },
		{ property: "og:description", content: app.description },
		{ property: "og:url", content: absoluteUrl(`/${layout.lang}/`) },
		{ property: "og:site_name", content: app.name },
		...localeMeta(layout.lang),
		...atlasCardMeta(layout.lang),
		...alternateLinks(layout.lang, "", { xDefault: "/" }),
	];
}

export default function Atlas({ loaderData }: Route.ComponentProps) {
	const { content } = loaderData;
	const trails = trailsIndex;
	const { t } = useTranslation();
	const lang = useLang();
	const navigate = useNavigate();
	const location = useLocation();
	const hydrated = useHydrated();
	const [params, setParams] = useSearchParams();
	const [hovered, setHovered] = useState<HoverInfo | null>(null);
	const [listHover, setListHover] = useState<string | null>(null);
	const [choices, setChoices] = useState<string[]>([]);
	const [closedOn, setClosedOn] = useState<string | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const [mapReady, setMapReady] = useState(false);

	const titleOf = (trail: TrailSummary) =>
		content[trail.slug]?.title ?? trail.name.original;
	const pageOf = (slug: string) => `/${lang}/trail/${slug}/`;
	const bySlug = new Map(trails.map((tr) => [tr.slug, tr]));

	const selected = hydrated
		? (bySlug.get(params.get("trail") ?? "") ?? null)
		: null;
	const filters = hydrated ? parseFilters(params) : emptyFilters;

	const format = useTrailFormat();
	const search = createSearch(
		trails.map((tr) => ({
			slug: tr.slug,
			title: titleOf(tr),
			original: tr.name.original,
			places: [tr.start.name, tr.end.name],
			countries: tr.countries.map(format.country),
		})),
	);
	const filtered = applyFilters(trails, filters);
	const ranked = search(filters.q);
	const results = ranked
		? ranked.flatMap((slug) => filtered.find((tr) => tr.slug === slug) ?? [])
		: [...filtered].sort((a, b) =>
				titleOf(a).localeCompare(titleOf(b), lang, { ignorePunctuation: true }),
			);
	const narrowed = countActive(filters) > 0 || filters.q.trim() !== "";

	const home = absoluteUrl(`/${lang}/`);
	const jsonLd = [
		websiteNode(home, t("app.name"), lang),
		{
			"@type": "CollectionPage",
			"@id": home,
			url: home,
			name: t("atlas.title"),
			description: t("app.description"),
			inLanguage: lang,
			isPartOf: { "@id": `${home}#website` },
			mainEntity: itemListNode(
				[...trails]
					.sort((a, b) =>
						titleOf(a).localeCompare(titleOf(b), lang, {
							ignorePunctuation: true,
						}),
					)
					.map((tr) => ({
						name: titleOf(tr),
						url: absoluteUrl(pageOf(tr.slug)),
					})),
			),
		},
	];

	// A sheet opened here gets its own history entry, so Back on a phone closes it
	// instead of leaving the site. A trail that came in with the URL has no entry of
	// its own behind it, so closing that one only rewrites the URL.
	const sheetPushed = (location.state as { sheet?: boolean } | null)?.sheet;

	function select(slug: string | null) {
		setChoices([]);
		if (!slug) setClosedOn(location.key);
		if (!slug && sheetPushed) {
			void navigate(-1);
			return;
		}
		const next = new URLSearchParams(params);
		if (slug) next.set("trail", slug);
		else next.delete("trail");
		const opening = slug !== null && selected === null;
		setParams(next, {
			replace: !opening,
			state: opening ? { sheet: true } : location.state,
			preventScrollReset: true,
		});
	}

	function pick(slugs: string[]) {
		const [only] = slugs;
		if (slugs.length > 1) return setChoices(slugs);
		if (!only) return select(null);
		// A mouse click opens the sheet like a tap does: going straight to the trail page
		// threw people off the map when they only meant to look. A second tap on the same
		// trail still goes through, but a double-click to zoom must not.
		if (selected?.slug === only && !canHover()) {
			void navigate(pageOf(only), { viewTransition: true });
			return;
		}
		select(only);
	}

	const highlighted =
		hovered?.slugs ??
		(listHover ? [listHover] : selected ? [selected.slug] : []);
	const hoverTrails = (hovered?.slugs ?? []).flatMap(
		(s) => bySlug.get(s) ?? [],
	);
	const choiceTrails = choices.flatMap((s) => bySlug.get(s) ?? []);
	const sheetOpen =
		(selected !== null && closedOn !== location.key) || choiceTrails.length > 0;

	const placeholder = (
		<div
			className={`absolute inset-0 z-10 grid place-items-center bg-water md:ps-[25rem] transition-[opacity,visibility] duration-300 motion-reduce:transition-none ${mapReady ? "invisible opacity-0" : ""}`}
			aria-busy={!mapReady}
			aria-hidden={mapReady || undefined}
		>
			<p
				role="status"
				className="flex items-center gap-3 rounded-full bg-surface/90 py-2.5 ps-3 pe-5 text-sm font-medium shadow-float backdrop-blur"
			>
				<span
					aria-hidden="true"
					className="size-5 rounded-full border-[3px] border-brand/20 border-t-brand motion-safe:animate-spin"
				/>
				{t("atlas.loading")}
			</p>
		</div>
	);

	const mapFailed = (
		<p className="absolute inset-0 z-10 grid place-items-center bg-canvas px-6 text-center text-sm text-muted">
			{t("atlas.mapFailed")}
		</p>
	);

	return (
		<main className="atlas relative h-dvh overflow-hidden">
			<h1 className="sr-only">{t("atlas.title")}</h1>
			{placeholder}
			{hydrated && (
				<MapBoundary fallback={mapFailed}>
					<Suspense fallback={null}>
						<AtlasMap
							trails={trails}
							focus={selected}
							highlighted={highlighted}
							visible={narrowed ? results.map((tr) => tr.slug) : null}
							frame={{
								key: `${filters.regions.join(",")}|${filters.country ?? ""}`,
								trails: results,
								underPanel: panelOpen,
							}}
							onLoad={() => setMapReady(true)}
							onHover={setHovered}
							onPick={(slugs) => {
								setPanelOpen(false);
								pick(slugs);
							}}
						/>
					</Suspense>
				</MapBoundary>
			)}

			<header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
				<p className="pointer-events-auto flex items-center gap-2 rounded-full bg-surface/90 py-1 ps-1.5 pe-4 font-display text-sm font-semibold shadow-float backdrop-blur">
					<LogoMark className="size-8" />
					{t("app.name")}
				</p>
				<div className="pointer-events-auto">
					<LanguageSwitcher />
				</div>
			</header>

			<TrailPanel
				trails={results}
				allTrails={trails}
				filters={filters}
				titleOf={titleOf}
				onChange={(change) =>
					setParams((prev) => writeFilters(prev, change(parseFilters(prev))), {
						replace: true,
						state: location.state,
						preventScrollReset: true,
					})
				}
				onHoverTrail={setListHover}
				onSelect={select}
				open={panelOpen}
				onOpenChange={setPanelOpen}
			/>

			{hovered && !selected && (
				<HoverCard
					x={hovered.x}
					y={hovered.y}
					trails={hoverTrails}
					content={content}
					photos={photos}
					titleOf={titleOf}
				/>
			)}

			{sheetOpen && (
				<TrailSheet
					label={selected ? titleOf(selected) : t("atlas.pick")}
					onClose={() => select(null)}
				>
					{choiceTrails.length > 0 ? (
						<>
							<h2 className="mb-2 min-h-11 pe-12 text-sm font-semibold">
								{t("atlas.pick")}
							</h2>
							<ul className="flex flex-col gap-1.5">
								{choiceTrails.map((tr) => (
									<li key={tr.slug}>
										<button
											type="button"
											onClick={() => select(tr.slug)}
											className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-soft/60 px-3 py-3 text-start font-medium hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand"
										>
											<span
												className="size-2.5 shrink-0 rounded-full"
												style={{ background: trailColor(tr.type) }}
											/>
											<span className="flex-1">{titleOf(tr)}</span>
											<span
												aria-hidden="true"
												className="text-lg leading-none text-muted rtl:-scale-x-100"
											>
												›
											</span>
										</button>
									</li>
								))}
							</ul>
						</>
					) : (
						selected && (
							<TrailPreview
								trail={selected}
								content={content[selected.slug]}
								photo={photos[selected.slug] ?? null}
								variant="sheet"
							/>
						)
					)}
				</TrailSheet>
			)}
			<JsonLd graph={jsonLd} />
		</main>
	);
}
