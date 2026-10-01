import type { TFunction } from "i18next";
import type { MetaDescriptor } from "react-router";
import { alternateLinks, localeMeta } from "~/features/i18n/alternates";
import { getI18n } from "~/features/i18n/i18n";
import type { Lang } from "~/features/i18n/languages";
import type { Messages } from "~/features/i18n/messages";
import type { TrailSummary } from "~/features/trails/trail-schema";
import { trailFormat } from "~/features/trails/use-trail-format";
import { absoluteUrl } from "~/shared/site";
import { atlasCardMeta, photoCardMeta } from "~/shared/social-cards";
import type { HubData } from "./hub-data";
import { type Hub, hubPath } from "./hubs";

export function hubTitle(t: TFunction, lang: Lang, hub: Hub): string {
	return hub.kind === "country"
		? t("hub.countryTitle", { country: trailFormat(t, lang).country(hub.code) })
		: t("hub.typeTitle", { types: t(`trailTypePlural.${hub.type}`) });
}

export function hubIntro(
	t: TFunction,
	lang: Lang,
	hub: Hub,
	trails: readonly TrailSummary[],
): string {
	const format = trailFormat(t, lang);
	const lengths = trails.map((tr) => tr.lengthKm);
	const facts = {
		count: trails.length,
		shortest: format.km(Math.min(...lengths)),
		longest: format.km(Math.max(...lengths)),
	};
	if (hub.kind === "country") {
		return t("hub.countryIntro", {
			...facts,
			country: format.country(hub.code),
		});
	}
	const countries = [...new Set(trails.flatMap((tr) => tr.countries))].sort(
		(a, b) => format.country(a).localeCompare(format.country(b), lang),
	);
	return t("hub.typeIntro", {
		...facts,
		countries: format.countries(countries),
	});
}

export function hubMeta(
	hub: HubData,
	lang: Lang,
	messages: Messages,
): MetaDescriptor[] {
	const t = getI18n(lang, messages).getFixedT(lang);
	const title = hubTitle(t, lang, hub.hub);
	const summaries = hub.trails.map((tr) => tr.summary);
	const description = `${hubIntro(t, lang, hub.hub, summaries)} ${t("hub.each")}`;
	const rest = hubPath(hub.hub);
	const cover = hub.trails.find((tr) => tr.photo)?.photo;
	return [
		{ title: `${title} · ${messages.app.name}` },
		{ name: "description", content: description },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: absoluteUrl(`/${lang}/${rest}`) },
		{ property: "og:site_name", content: messages.app.name },
		...localeMeta(lang),
		...(cover ? photoCardMeta(cover) : atlasCardMeta(lang)),
		...alternateLinks(lang, rest),
	];
}
