import type { TrailContent } from "./content-schema";
import type { TrailFile, TrailSummary } from "./trail-schema";

type Input = {
	summary: TrailSummary;
	file: TrailFile;
	content: TrailContent;
	url: string;
	atlas: { name: string; url: string };
	countryNames: string[];
	faq: { question: string; answer: string }[];
};

export function trailJsonLd(input: Input): object {
	const { summary, file, content, url, atlas, countryNames, faq } = input;
	const [lng, lat] = file.start.coords;
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "TouristAttraction",
				"@id": `${url}#trail`,
				name: content.title,
				...(content.title !== file.name.original
					? { alternateName: file.name.original }
					: {}),
				description: content.summary,
				url,
				inLanguage: content.lang,
				sameAs: [file.officialUrl],
				isAccessibleForFree: true,
				publicAccess: true,
				geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
				containedInPlace: countryNames.map((name) => ({
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
			{
				"@type": "BreadcrumbList",
				itemListElement: [
					{
						"@type": "ListItem",
						position: 1,
						name: atlas.name,
						item: atlas.url,
					},
					{ "@type": "ListItem", position: 2, name: content.title, item: url },
				],
			},
			{
				"@type": "FAQPage",
				mainEntity: faq.map(({ question, answer }) => ({
					"@type": "Question",
					name: question,
					acceptedAnswer: { "@type": "Answer", text: answer },
				})),
			},
		],
	};
}

export function serializeJsonLd(value: object): string {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}
