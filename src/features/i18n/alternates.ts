import type { MetaDescriptor } from "react-router";
import { absoluteUrl } from "~/shared/site";
import { type Lang, ogLocale } from "./languages";
import { publishedLanguages } from "./published";

type Options = {
	xDefault?: string;
	langs?: readonly Lang[];
};

export function alternateLinks(
	lang: Lang,
	rest: string,
	{
		xDefault = `/en/${rest}`,
		langs = publishedLanguages.map(({ code }) => code),
	}: Options = {},
): MetaDescriptor[] {
	return [
		{
			tagName: "link",
			rel: "canonical",
			href: absoluteUrl(`/${lang}/${rest}`),
		},
		...langs.map((code) => ({
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

export function localeMeta(lang: Lang): MetaDescriptor[] {
	return [
		{ property: "og:locale", content: ogLocale(lang) },
		...publishedLanguages
			.filter(({ code }) => code !== lang)
			.map(({ code }) => ({
				property: "og:locale:alternate",
				content: ogLocale(code),
			})),
	];
}
