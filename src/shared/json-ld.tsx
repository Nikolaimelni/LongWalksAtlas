export type JsonLdNode = Record<string, unknown>;

type Link = { name: string; url: string };

// Each language edition is its own WebSite, all named "Long Walks Atlas": at /ru/, at
// /en/ and at /, which is the one Google reads for the site name.
export function websiteNode(
	home: string,
	name: string,
	lang: string,
): JsonLdNode {
	return {
		"@type": "WebSite",
		"@id": `${home}#website`,
		url: home,
		name,
		inLanguage: lang,
	};
}

export function itemListNode(items: readonly Link[]): JsonLdNode {
	return {
		"@type": "ItemList",
		numberOfItems: items.length,
		itemListElement: items.map((item, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: item.name,
			url: item.url,
		})),
	};
}

export function breadcrumbNode(id: string, path: readonly Link[]): JsonLdNode {
	return {
		"@type": "BreadcrumbList",
		"@id": id,
		itemListElement: path.map((step, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: step.name,
			item: step.url,
		})),
	};
}

export function serializeJsonLd(value: object): string {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}

type Props = { graph: readonly JsonLdNode[] };

export function JsonLd({ graph }: Props) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes "<", so no string in the data can end this tag
			dangerouslySetInnerHTML={{
				__html: serializeJsonLd({
					"@context": "https://schema.org",
					"@graph": graph,
				}),
			}}
		/>
	);
}
