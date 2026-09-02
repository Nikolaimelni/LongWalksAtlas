import {
	type DefaultTreeAdapterMap,
	parseFragment,
	serialize,
	html as spec,
	defaultTreeAdapter as tree,
} from "parse5";
import { siteUrl } from "../src/shared/site.ts";

type ChildNode = DefaultTreeAdapterMap["childNode"];

const allowed: Record<string, readonly string[]> = {
	p: [],
	br: [],
	hr: [],
	em: [],
	strong: [],
	blockquote: [],
	h3: [],
	h4: [],
	ul: [],
	ol: ["start"],
	li: [],
	a: ["href", "title"],
};

const linkProtocols = new Set(["https:", "http:", "mailto:"]);

const context = tree.createElement("div", spec.NS.HTML, []);

export function parseStoryHtml(html: string): {
	html: string;
	problems: string[];
} {
	const fragment = parseFragment(context, html, {});
	const problems: string[] = [];

	const visit = (nodes: ChildNode[]) => {
		for (const node of nodes) {
			if (tree.isTextNode(node) || tree.isCommentNode(node)) continue;
			if (!tree.isElementNode(node)) {
				problems.push(`${node.nodeName} is not allowed`);
				continue;
			}
			const attrs = allowed[node.tagName];
			if (!attrs || node.namespaceURI !== spec.NS.HTML) {
				problems.push(`<${node.tagName}> is not allowed`);
				continue;
			}
			for (const { name, value } of node.attrs) {
				if (!attrs.includes(name)) {
					problems.push(`<${node.tagName} ${name}> is not allowed`);
				} else if (name === "href" && !isSafeLink(value)) {
					problems.push(`a link to "${value}" is not allowed`);
				}
			}
			visit(node.childNodes);
		}
	};
	visit(fragment.childNodes);

	return { html: serialize(fragment), problems };
}

function isSafeLink(href: string): boolean {
	try {
		return linkProtocols.has(new URL(href, siteUrl).protocol);
	} catch {
		return false;
	}
}
