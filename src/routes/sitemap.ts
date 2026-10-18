import { hubPath, listHubs } from "~/features/hubs/hubs";
import type { Lang } from "~/features/i18n/languages";
import { publishedLanguages } from "~/features/i18n/published";
import { textLanguages } from "~/features/trails/text-languages";
import { trailsIndex } from "~/features/trails/trails-index";
import { absoluteUrl } from "~/shared/site";

type Page = {
	rest: string;
	langs: readonly Lang[];
	xDefault: string;
};

export async function loader() {
	const everywhere = publishedLanguages.map(({ code }) => code);
	const pages: Page[] = [
		{
			rest: "",
			langs: everywhere,
			xDefault: "/",
		},
		...listHubs(trailsIndex).map(
			(hub): Page => ({
				rest: hubPath(hub),
				langs: everywhere,
				xDefault: `/en/${hubPath(hub)}`,
			}),
		),
		...(await Promise.all(
			trailsIndex.map(
				async (t): Promise<Page> => ({
					rest: `trail/${t.slug}/`,
					langs: await textLanguages(t.slug),
					xDefault: `/en/trail/${t.slug}/`,
				}),
			),
		)),
	];

	const urls = pages.flatMap((page) => {
		const alternates = [
			...page.langs.map(
				(code) =>
					`<xhtml:link rel="alternate" hreflang="${code}" href="${absoluteUrl(`/${code}/${page.rest}`)}"/>`,
			),
			`<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(page.xDefault)}"/>`,
		].join("");
		return page.langs.map(
			(code) =>
				`<url><loc>${absoluteUrl(`/${code}/${page.rest}`)}</loc>${alternates}</url>`,
		);
	});
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
	return new Response(xml, {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
}
