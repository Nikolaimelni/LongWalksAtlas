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
	faq: { question: string; answer: string }[];
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
			url,
			// Wikidata ties the page to the entity search engines already know.
			sameAs: [
				file.officialUrl,
				...(file.wikidata
					? [`https://www.wikidata.org/wiki/${file.wikidata}`]
					: []),
			],
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
				{
					"@type": "PropertyValue",
					name: "days on foot",
					minValue: summary.days.min,
					maxValue: summary.days.max,
				},
			],
		},
		breadcrumbNode(`${url}#breadcrumb`, [
			site,
			...parents,
			{ name: content.title, url },
		]),
		{
			// A WebPage subtype: the page itself, which answers the questions it lists.
			"@type": "FAQPage",
			"@id": url,
			url,
			name: content.title,
			description: content.summary,
			inLanguage: lang,
			isPartOf: { "@id": `${site.url}#website` },
			about: { "@id": `${url}#trail` },
			breadcrumb: { "@id": `${url}#breadcrumb` },
			...(image ? { primaryImageOfPage: image } : {}),
			dateModified: file.verifiedAt,
			mainEntity: input.faq.map(({ question, answer }) => ({
				"@type": "Question",
				name: question,
				acceptedAnswer: { "@type": "Answer", text: answer },
			})),
		},
		websiteNode(site.url, site.name, lang),
	];
}
