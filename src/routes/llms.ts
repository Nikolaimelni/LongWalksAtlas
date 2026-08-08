import { publishedLanguages } from "~/features/i18n/published";
import { loadContentIndex } from "~/features/trails/content";
import { trailsIndex } from "~/features/trails/trails-index";
import en from "~/locales/en.json";
import { absoluteUrl } from "~/shared/site";

export async function loader() {
	const content = await loadContentIndex("en");
	const trails = trailsIndex
		.map((t) => {
			const text = content[t.slug];
			const title = text?.title ?? t.name.original;
			return `- [${title}](${absoluteUrl(`/en/trail/${t.slug}/`)}): ${text?.summary ?? ""} ${t.lengthKm} km, ${t.days.min}–${t.days.max} days on foot.`;
		})
		.join("\n");

	const names = new Intl.DisplayNames(["en"], { type: "language" });
	const offered = new Intl.ListFormat("en").format(
		publishedLanguages.map(({ code }) => `${names.of(code)} (/${code}/)`),
	);

	const body = `# ${en.app.name}

> ${en.app.description}

Every trail page gives the length, days on foot, start and end, countries, best months, the official website and the sources the facts were checked against. Pages exist in ${offered}; swap the language segment of a URL to change language.

## Trails

${trails}
`;
	return new Response(body, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
