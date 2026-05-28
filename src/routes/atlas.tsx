import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "~/features/i18n/language-switcher";
import { useHydrated } from "~/shared/use-hydrated";
import type { Route } from "./+types/atlas";

const AtlasMap = lazy(() =>
	import("~/features/map/atlas-map").then((m) => ({ default: m.AtlasMap })),
);

export function meta({ matches }: Route.MetaArgs) {
	const layout = matches[1]?.loaderData;
	const messages = layout?.messages[layout.lang] ?? layout?.messages.en;
	return [{ title: messages?.app.name }];
}

export default function Atlas() {
	const { t } = useTranslation();
	const hydrated = useHydrated();
	const placeholder = (
		<div
			className="absolute inset-0 grid place-items-center bg-stone-100 text-sm text-stone-500 dark:bg-stone-900"
			aria-busy="true"
		>
			{t("atlas.loading")}
		</div>
	);

	return (
		<main className="relative h-dvh overflow-hidden">
			<h1 className="sr-only">{t("atlas.title")}</h1>
			{hydrated ? (
				<Suspense fallback={placeholder}>
					<AtlasMap />
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
		</main>
	);
}
