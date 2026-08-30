import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { data, useNavigate, useSearchParams } from "react-router";
import {
	applyFilters,
	countActive,
	type Filters,
	parseFilters,
	writeFilters,
} from "~/features/filters/filters";
import { createSearch } from "~/features/filters/search";
import { TrailPanel } from "~/features/filters/trail-panel";
import { alternateLinks } from "~/features/i18n/alternates";
import { LanguageSwitcher } from "~/features/i18n/language-switcher";
import { isLang } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import type { HoverInfo } from "~/features/map/atlas-map";
import { hoverPlacement } from "~/features/map/hover-placement";
import { loadContentIndex } from "~/features/trails/content";
import { TrailPreview } from "~/features/trails/trail-preview";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { photos, trailsIndex } from "~/features/trails/trails-index";
import { canHover } from "~/shared/can-hover";
import { LogoMark } from "~/shared/logo-mark";
import { prerenderedOnly } from "~/shared/prerendered-only";
import { revalidateOnPathChange } from "~/shared/same-path";
import { absoluteUrl } from "~/shared/site";
import { atlasCardMeta } from "~/shared/social-cards";
import { useHydrated } from "~/shared/use-hydrated";
import type { Route } from "./+types/atlas";

const AtlasMap = lazy(() =>
	import("~/features/map/atlas-map").then((m) => ({ default: m.AtlasMap })),
);

export async function loader({ params }: Route.LoaderArgs) {
	if (!isLang(params.lang)) throw data("Unknown language", { status: 404 });
	return {
		trails: trailsIndex,
		photos,
		content: await loadContentIndex(params.lang),
	};
}

export const clientLoader = ({ serverLoader }: Route.ClientLoaderArgs) =>
	prerenderedOnly(serverLoader);

export const shouldRevalidate = revalidateOnPathChange;

export function meta({ matches }: Route.MetaArgs) {
	const layout = matches[1]?.loaderData;
	if (!layout) return [];
	const app = layout.messages.app;
	return [
		{ title: app?.name },
		{ name: "description", content: app?.description },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: app?.name },
		{ property: "og:description", content: app?.description },
		{ property: "og:url", content: absoluteUrl(`/${layout.lang}/`) },
		{ property: "og:locale", content: layout.lang.replace("-", "_") },
		...atlasCardMeta(layout.lang),
		...alternateLinks(layout.lang, "", "/"),
	];
}

const noFilters: Filters = {
	q: "",
	types: [],
	country: null,
	length: null,
	days: null,
};

export default function Atlas({ loaderData }: Route.ComponentProps) {
	const { trails, content, photos } = loaderData;
	const { t } = useTranslation();
	const lang = useLang();
	const navigate = useNavigate();
	const hydrated = useHydrated();
	const [params, setParams] = useSearchParams();
	const [hovered, setHovered] = useState<HoverInfo | null>(null);
	const [listHover, setListHover] = useState<string | null>(null);
	const [choices, setChoices] = useState<string[]>([]);

	const titleOf = (trail: TrailSummary) =>
		content[trail.slug]?.title ?? trail.name.original;
	const pageOf = (slug: string) => `/${lang}/trail/${slug}/`;
	const bySlug = new Map(trails.map((tr) => [tr.slug, tr]));

	const selected = hydrated
		? (bySlug.get(params.get("trail") ?? "") ?? null)
		: null;
	const filters = hydrated ? parseFilters(params) : noFilters;

	const regions = new Intl.DisplayNames([lang], { type: "region" });
	const search = createSearch(
		trails.map((tr) => ({
			slug: tr.slug,
			title: titleOf(tr),
			original: tr.name.original,
			places: [tr.start.name, tr.end.name],
			countries: tr.countries.map((c) => regions.of(c) ?? c),
		})),
	);
	const filtered = applyFilters(trails, filters);
	const ranked = search(filters.q);
	const results = ranked
		? ranked.flatMap((slug) => filtered.find((tr) => tr.slug === slug) ?? [])
		: [...filtered].sort((a, b) => titleOf(a).localeCompare(titleOf(b), lang));
	const narrowed = countActive(filters) > 0 || filters.q.trim() !== "";

	function update(next: URLSearchParams) {
		setParams(next, { replace: true, preventScrollReset: true });
	}

	function select(slug: string | null) {
		setChoices([]);
		const next = new URLSearchParams(params);
		if (slug) next.set("trail", slug);
		else next.delete("trail");
		update(next);
	}

	function pick(slugs: string[]) {
		const [only] = slugs;
		if (slugs.length > 1) return setChoices(slugs);
		if (!only) return select(null);
		if (canHover() || selected?.slug === only) {
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
	const sheetOpen = selected !== null || choiceTrails.length > 0;

	const placeholder = (
		<div
			className="absolute inset-0 grid place-items-center bg-soft text-sm text-muted"
			aria-busy="true"
		>
			{t("atlas.loading")}
		</div>
	);

	return (
		<main className="relative h-dvh overflow-hidden [&_.maplibregl-ctrl-bottom-right]:bottom-[calc(6rem+env(safe-area-inset-bottom))] md:[&_.maplibregl-ctrl-bottom-right]:bottom-0">
			<h1 className="sr-only">{t("atlas.title")}</h1>
			{hydrated ? (
				<Suspense fallback={placeholder}>
					<AtlasMap
						focus={selected}
						highlighted={highlighted}
						visible={narrowed ? results.map((tr) => tr.slug) : null}
						onHover={setHovered}
						onPick={pick}
					/>
				</Suspense>
			) : (
				placeholder
			)}

			<header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
				<p className="pointer-events-auto flex items-center gap-2 rounded-full bg-surface/90 py-2 ps-2.5 pe-4 font-serif text-sm font-semibold shadow-float backdrop-blur">
					<LogoMark className="size-6 text-brand" />
					{t("app.name")}
				</p>
				<div className="pointer-events-auto">
					<LanguageSwitcher />
				</div>
			</header>

			<div className={sheetOpen ? "hidden md:contents" : "contents"}>
				<TrailPanel
					trails={results}
					allTrails={trails}
					filters={filters}
					titleOf={titleOf}
					onChange={(change) =>
						setParams(
							(prev) => writeFilters(prev, change(parseFilters(prev))),
							{
								replace: true,
								preventScrollReset: true,
							},
						)
					}
					onHoverTrail={setListHover}
					onSelect={select}
				/>
			</div>

			{hoverTrails[0] && !selected && (
				<div
					className="pointer-events-none absolute z-20 w-64 overflow-hidden rounded-xl bg-surface p-3 shadow-float transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none"
					style={hoverPlacement(hovered?.x ?? 0, hovered?.y ?? 0, {
						width: window.innerWidth,
						height: window.innerHeight,
					})}
				>
					{hoverTrails.length === 1 ? (
						<TrailPreview
							trail={hoverTrails[0]}
							content={content[hoverTrails[0].slug]}
							photo={photos[hoverTrails[0].slug] ?? null}
							variant="hover"
						/>
					) : (
						<ul className="flex flex-col gap-1 text-sm font-medium">
							{hoverTrails.map((tr) => (
								<li key={tr.slug}>{titleOf(tr)}</li>
							))}
						</ul>
					)}
				</div>
			)}

			{sheetOpen && (
				<section
					aria-label={selected ? titleOf(selected) : t("atlas.pick")}
					className="absolute inset-x-0 bottom-0 z-20 max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-float transition-[translate,opacity] duration-300 ease-out starting:translate-y-full motion-reduce:transition-none md:inset-x-auto md:start-[26rem] md:bottom-4 md:max-h-[calc(100dvh-6rem)] md:w-96 md:rounded-2xl md:starting:translate-y-4 md:starting:opacity-0"
				>
					{choiceTrails.length > 0 ? (
						<>
							<h2 className="mb-2 text-sm font-semibold">{t("atlas.pick")}</h2>
							<ul className="flex flex-col">
								{choiceTrails.map((tr) => (
									<li key={tr.slug}>
										<button
											type="button"
											onClick={() => select(tr.slug)}
											className="w-full rounded-lg px-3 py-3 text-start hover:bg-soft"
										>
											{titleOf(tr)}
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
								onClose={() => select(null)}
							/>
						)
					)}
				</section>
			)}
		</main>
	);
}
