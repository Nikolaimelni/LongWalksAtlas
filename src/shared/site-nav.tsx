import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LanguageSwitcher } from "~/features/i18n/language-switcher";
import { useLang } from "~/features/i18n/use-lang";
import { LogoMark } from "./logo-mark";

export function SiteNav() {
	const { t } = useTranslation();
	const lang = useLang();
	return (
		<nav className="flex items-center justify-between gap-2 py-2">
			<Link
				to={`/${lang}/`}
				viewTransition
				className="flex items-center gap-2 rounded-full py-1 ps-1 pe-3 font-display text-sm font-semibold hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand"
			>
				<LogoMark className="size-8 text-brand" />
				{t("app.name")}
			</Link>
			<LanguageSwitcher />
		</nav>
	);
}
