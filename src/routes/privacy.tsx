import { Trans, useTranslation } from "react-i18next";
import { alternateLinks, localeMeta } from "~/features/i18n/alternates";
import { EmailLink } from "~/shared/email-link";
import { absoluteUrl, contactEmail } from "~/shared/site";
import { SiteFooter } from "~/shared/site-footer";
import { SiteNav } from "~/shared/site-nav";
import { atlasCardMeta } from "~/shared/social-cards";
import type { Route } from "./+types/privacy";

export function meta({ matches }: Route.MetaArgs) {
	const layout = matches[1]?.loaderData;
	if (!layout) return [];
	const { lang, messages } = layout;
	const title = messages.legal.title;
	return [
		{ title: `${title} · ${messages.app.name}` },
		{ name: "description", content: messages.legal.description },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: title },
		{ property: "og:url", content: absoluteUrl(`/${lang}/privacy/`) },
		{ property: "og:site_name", content: messages.app.name },
		...localeMeta(lang),
		...atlasCardMeta(lang),
		...alternateLinks(lang, "privacy/"),
	];
}

export default function Privacy() {
	const { t } = useTranslation();
	return (
		<main className="mx-auto max-w-3xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10">
			<SiteNav />
			<h1 className="mt-4 font-display text-3xl leading-tight font-semibold">
				{t("legal.title")}
			</h1>

			<h2 className="mt-8 font-display text-xl font-semibold">
				{t("legal.useHeading")}
			</h2>
			<p className="mt-2 leading-relaxed">{t("legal.use")}</p>
			<p className="mt-2 leading-relaxed">{t("legal.risk")}</p>

			<h2 className="mt-8 font-display text-xl font-semibold">
				{t("legal.privacyHeading")}
			</h2>
			<p className="mt-2 leading-relaxed">{t("legal.noCookies")}</p>
			<p className="mt-2 leading-relaxed">{t("legal.analytics")}</p>
			<p className="mt-2 leading-relaxed">{t("legal.map")}</p>
			<p className="mt-2 leading-relaxed">{t("legal.storage")}</p>
			<p className="mt-2 leading-relaxed">
				<Trans
					i18nKey="legal.contact"
					values={{ email: contactEmail }}
					components={{ a: <EmailLink /> }}
				/>
			</p>

			<SiteFooter />
		</main>
	);
}
