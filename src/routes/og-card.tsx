import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { trailsIndex } from "~/features/trails/trails-index";
import { LogoMark } from "~/shared/logo-mark";
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
		<main className="relative h-[630px] w-[1200px] overflow-hidden bg-canvas">
			{hydrated && (
				<Suspense fallback={null}>
					<OgMap />
				</Suspense>
			)}
			<div className="absolute inset-y-0 start-0 flex w-[540px] flex-col justify-between bg-gradient-to-r from-canvas via-canvas/95 to-canvas/0 p-14 pe-24">
				<div>
					<LogoMark className="size-20" />
					<p className="mt-6 font-serif text-6xl leading-tight font-semibold text-ink">
						{t("app.name")}
					</p>
					<p className="mt-5 text-2xl leading-snug text-ink">
						{t("og.tagline")}
					</p>
				</div>
				<div className="text-xl text-muted">
					<p className="font-semibold text-brand">
						{t("filters.count", { count: trailsIndex.length })}
					</p>
					<p>longwalksatlas.com</p>
				</div>
			</div>
			<p className="absolute end-3 bottom-2 rounded bg-surface/85 px-2 py-0.5 text-xs text-muted">
				© OpenStreetMap contributors · OpenFreeMap
			</p>
		</main>
	);
}
