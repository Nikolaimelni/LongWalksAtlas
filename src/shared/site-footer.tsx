import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useLang } from "~/features/i18n/use-lang";
import { SuggestTrail } from "./suggest-trail";

export function SiteFooter() {
	const { t } = useTranslation();
	return (
		<footer className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
			<p>{t("app.description")}</p>
			<SuggestTrail className="mt-2" />
			<p className="mt-2">{t("site.credits")}</p>
			<p className="mt-2">{t("site.translations")}</p>
			<p className="mt-2">
				<SiteLinks />
			</p>
		</footer>
	);
}

export function SiteLinks() {
	const { t } = useTranslation();
	const lang = useLang();
	return (
		<>
			<Link to={`/${lang}/privacy/`} viewTransition className="underline">
				{t("legal.link")}
			</Link>
			{" · "}
			<a
				href="https://nikolaidev.online"
				target="_blank"
				rel="noopener author"
				className="underline"
			>
				nikolaidev.online
			</a>
		</>
	);
}
