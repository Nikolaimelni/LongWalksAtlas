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
import { loadContentIndex } from "~/features/trails/content";
import { TrailPreview } from "~/features/trails/trail-preview";
import type { TrailPhoto, TrailSummary } from "~/features/trails/trail-schema";
import photos from "~/generated/photos.json";
import trailsIndex from "~/generated/trails-index.json";
import { canHover } from "~/shared/can-hover";
import { prerenderedOnly } from "~/shared/prerendered-only";
import { absoluteUrl } from "~/shared/site";
import { useHydrated } from "~/shared/use-hydrated";
import type { Route } from "./+types/atlas";

const AtlasMap = lazy(() =>
	import("~/features/map/atlas-map").then((m) => ({ default: m.AtlasMap })),
);

export async function loader({ params }: Route.LoaderArgs) {
	if (!isLang(params.lang)) throw data("Unknown language", { status: 404 });
	return {
		// why: written by scripts/build-data.ts from Zod-validated trail files; JSON imports
		// widen string unions, so the type has to be restated here.
		trails: trailsIndex as TrailSummary[],
		// why: written by scripts/build-photos.ts from Zod-validated Commons responses.
		photos: photos as Record<string, TrailPhoto>,
		content: await loadContentIndex(params.lang),
	};
}

export const clientLoader = ({ serverLoader }: Route.ClientLoaderArgs) =>
	prerenderedOnly(serverLoader);

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
		{ name: "twitter:card", content: "summary" },
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
			void navigate(pageOf(only));
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
			className="absolute inset-0 grid place-items-center bg-stone-100 text-sm text-stone-500 dark:bg-stone-900"
			aria-busy="true"
		>
			{t("atlas.loading")}
		</div>
	);

	return (
		<main className="relative h-dvh overflow-hidden [&_.maplibregl-ctrl-bottom-right]:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:[&_.maplibregl-ctrl-bottom-right]:bottom-0">
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
				<p className="pointer-events-auto rounded-full bg-white/90 px-4 py-2 text-sm font-semibold shadow-md backdrop-blur dark:bg-stone-900/90">
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
					onChange={(next) => update(writeFilters(params, next))}
					onHoverTrail={setListHover}
					onSelect={select}
				/>
			</div>

			{hoverTrails[0] && !selected && (
				<div
					className="pointer-events-none absolute z-20 w-64 rounded-xl bg-white p-3 shadow-xl dark:bg-stone-900"
					style={{ left: (hovered?.x ?? 0) + 16, top: (hovered?.y ?? 0) + 16 }}
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
					className="absolute inset-x-0 bottom-0 z-20 max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl md:inset-x-auto md:start-[26rem] md:bottom-4 md:w-96 md:rounded-2xl dark:bg-stone-900"
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
											className="w-full rounded-lg px-3 py-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800"
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
