import { languages } from "~/features/i18n/languages";
import { trailsIndex } from "~/features/trails/trails-index";
import { absoluteUrl } from "~/shared/site";

export function loader() {
	const pages = ["", ...trailsIndex.map((t) => `trail/${t.slug}/`)];
	const urls = pages.flatMap((rest) => {
		const alternates = [
			...languages.map(
				({ code }) =>
					`<xhtml:link rel="alternate" hreflang="${code}" href="${absoluteUrl(`/${code}/${rest}`)}"/>`,
			),
			`<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(rest ? `/en/${rest}` : "/")}"/>`,
		].join("");
		return languages.map(
			({ code }) =>
				`<url><loc>${absoluteUrl(`/${code}/${rest}`)}</loc>${alternates}</url>`,
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
