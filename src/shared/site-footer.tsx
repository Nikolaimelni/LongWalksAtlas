import { useTranslation } from "react-i18next";
import { SuggestTrail } from "./suggest-trail";

export function SiteFooter() {
	const { t } = useTranslation();
	return (
		<footer className="mt-16 border-t border-line pt-6 text-xs leading-relaxed text-muted">
			<p>{t("app.description")}</p>
			<SuggestTrail className="mt-2" />
			<p className="mt-2">{t("site.credits")}</p>
			<p className="mt-2">{t("site.translations")}</p>
		</footer>
	);
}
