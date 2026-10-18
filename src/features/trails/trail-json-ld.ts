import type { Lang } from "~/features/i18n/languages";
import { breadcrumbNode, type JsonLdNode, websiteNode } from "~/shared/json-ld";
import type { TrailContent } from "./content-schema";
import type { TrailFile, TrailSummary } from "./trail-schema";

type Link = { name: string; url: string };

type Input = {
	summary: TrailSummary;
	file: TrailFile;
	content: TrailContent;
	lang: Lang;
	url: string;
	site: Link;
	parents: Link[];
	image: string | null;
	countryNames: string[];
};

export function trailJsonLd(input: Input): JsonLdNode[] {
	const { summary, file, content, lang, url, site, parents, image } = input;
	const [lng, lat] = file.start.coords;
	return [
		{
			"@type": "TouristAttraction",
			"@id": `${url}#trail`,
			name: content.title,
			...(content.title !== file.name.original
				? { alternateName: file.name.original }
				: {}),
			description: content.summary,
			// The trail's own site; this page is the WebPage below, which is about it.
			url: file.officialUrl,
			// Wikidata ties the page to the entity search engines already know.
			...(file.wikidata
				? { sameAs: [`https://www.wikidata.org/wiki/${file.wikidata}`] }
				: {}),
			...(image ? { image } : {}),
			isAccessibleForFree: true,
			publicAccess: true,
			geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
			containedInPlace: input.countryNames.map((name) => ({
				"@type": "Country",
				name,
			})),
			additionalProperty: [
				{
					"@type": "PropertyValue",
					name: "length",
					value: summary.lengthKm,
					unitCode: "KMT",
				},
				// An estimate from the length is said on the page, but it is not a fact.
				...(summary.daysSource === "official"
					? [
							{
								"@type": "PropertyValue",
								name: "days on foot",
								minValue: summary.days.min,
								maxValue: summary.days.max,
							},
						]
					: []),
			],
		},
		breadcrumbNode(`${url}#breadcrumb`, [
			site,
			...parents,
			{ name: content.title, url },
		]),
		{
			"@type": "WebPage",
			"@id": url,
			url,
			name: content.title,
			description: content.summary,
			inLanguage: lang,
			isPartOf: { "@id": `${site.url}#website` },
			about: { "@id": `${url}#trail` },
			breadcrumb: { "@id": `${url}#breadcrumb` },
			...(image ? { primaryImageOfPage: image } : {}),
		},
		websiteNode(site.url, site.name, lang),
	];
}
