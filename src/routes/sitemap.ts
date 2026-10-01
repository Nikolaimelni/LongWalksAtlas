import { hubPath, listHubs, trailsIn } from "~/features/hubs/hubs";
import type { Lang } from "~/features/i18n/languages";
import { publishedLanguages } from "~/features/i18n/published";
import { textLanguages } from "~/features/trails/text-languages";
import { lastChecked } from "~/features/trails/trail-files";
import { trailsIndex } from "~/features/trails/trails-index";
import { absoluteUrl } from "~/shared/site";

type Page = {
	rest: string;
	langs: readonly Lang[];
	xDefault: string;
	// The day the facts were checked: the change a reader would care about. A page
	// listing trails changes when the newest of them was checked.
	lastmod: string;
};

export async function loader() {
	const everywhere = publishedLanguages.map(({ code }) => code);
	const slugsOf = (trails: readonly { slug: string }[]) =>
		trails.map((t) => t.slug);

	const pages: Page[] = [
		{
			rest: "",
			langs: everywhere,
			xDefault: "/",
			lastmod: await lastChecked(slugsOf(trailsIndex)),
		},
		...(await Promise.all(
			listHubs(trailsIndex).map(
				async (hub): Promise<Page> => ({
					rest: hubPath(hub),
					langs: everywhere,
					xDefault: `/en/${hubPath(hub)}`,
					lastmod: await lastChecked(slugsOf(trailsIn(hub, trailsIndex))),
				}),
			),
		)),
		...(await Promise.all(
			trailsIndex.map(
				async (t): Promise<Page> => ({
					rest: `trail/${t.slug}/`,
					langs: await textLanguages(t.slug),
					xDefault: `/en/trail/${t.slug}/`,
					lastmod: await lastChecked([t.slug]),
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
				`<url><loc>${absoluteUrl(`/${code}/${page.rest}`)}</loc><lastmod>${page.lastmod}</lastmod>${alternates}</url>`,
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
