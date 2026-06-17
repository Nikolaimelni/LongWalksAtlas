import type { MetaDescriptor } from "react-router";
import { absoluteUrl } from "~/shared/site";
import { type Lang, languages } from "./languages";

export function alternateLinks(
	lang: Lang,
	rest: string,
	xDefault = `/en/${rest}`,
): MetaDescriptor[] {
	return [
		{
			tagName: "link",
			rel: "canonical",
			href: absoluteUrl(`/${lang}/${rest}`),
		},
		...languages.map(({ code }) => ({
			tagName: "link",
			rel: "alternate",
			hrefLang: code,
			href: absoluteUrl(`/${code}/${rest}`),
		})),
		{
			tagName: "link",
			rel: "alternate",
			hrefLang: "x-default",
			href: absoluteUrl(xDefault),
		},
	];
}
