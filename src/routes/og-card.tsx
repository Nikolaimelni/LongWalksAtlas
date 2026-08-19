import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { trailsIndex } from "~/features/trails/trails-index";
import { useHydrated } from "~/shared/use-hydrated";

const OgMap = lazy(() =>
	import("~/features/map/og-map").then((m) => ({ default: m.OgMap })),
);

export function meta() {
	return [{ name: "robots", content: "noindex" }];
}

export default function OgCard() {
	const { t } = useTranslation();
	const hydrated = useHydrated();
	return (
		<main className="relative h-[630px] w-[1200px] overflow-hidden bg-stone-100">
			{hydrated && (
				<Suspense fallback={null}>
					<OgMap />
				</Suspense>
			)}
			<div className="absolute inset-y-0 start-0 flex w-[520px] flex-col justify-between bg-gradient-to-r from-white via-white/95 to-white/0 p-14 pe-24">
				<div>
					<p className="font-serif text-6xl leading-tight font-semibold text-stone-900">
						{t("app.name")}
					</p>
					<p className="mt-6 text-2xl leading-snug text-stone-700">
						{t("og.tagline")}
					</p>
				</div>
				<div className="text-xl text-stone-600">
					<p className="font-semibold text-stone-900">
						{t("filters.count", { count: trailsIndex.length })}
					</p>
					<p>longwalksatlas.com</p>
				</div>
			</div>
			<p className="absolute end-3 bottom-2 rounded bg-white/85 px-2 py-0.5 text-xs text-stone-600">
				© OpenStreetMap contributors · OpenFreeMap
			</p>
		</main>
	);
}
