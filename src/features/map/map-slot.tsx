import { type ReactNode, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useHydrated } from "~/shared/use-hydrated";
import { MapBoundary } from "./map-boundary";

export function MapLoading() {
	const { t } = useTranslation();
	return (
		<p
			className="absolute inset-0 z-10 grid place-items-center bg-soft text-sm text-ink/70"
			aria-busy="true"
		>
			<span className="motion-safe:animate-pulse">{t("trail.mapLoading")}</span>
		</p>
	);
}

function MapFailed() {
	const { t } = useTranslation();
	return (
		<p className="absolute inset-0 z-10 grid place-items-center bg-soft px-6 text-center text-sm text-muted">
			{t("atlas.mapFailed")}
		</p>
	);
}

export function MapSlot({ children }: { children: ReactNode }) {
	const hydrated = useHydrated();
	if (!hydrated) return <MapLoading />;
	return (
		<MapBoundary fallback={<MapFailed />}>
			<Suspense fallback={<MapLoading />}>{children}</Suspense>
		</MapBoundary>
	);
}
