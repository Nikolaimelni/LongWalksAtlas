import { Link, redirect } from "react-router";
import { pickLang } from "~/features/i18n/languages";
import { publishedLanguages } from "~/features/i18n/published";
import { readStoredLang } from "~/features/i18n/stored-lang";
import en from "~/locales/en.json";
import { absoluteUrl } from "~/shared/site";
import { atlasCardMeta } from "~/shared/social-cards";

export function meta() {
	return [
		{ title: en.app.name },
		{ name: "description", content: en.app.description },
		{ tagName: "link", rel: "canonical", href: absoluteUrl("/") },
		...atlasCardMeta("en"),
		...publishedLanguages.map(({ code }) => ({
			tagName: "link",
			rel: "alternate",
			hrefLang: code,
			href: absoluteUrl(`/${code}/`),
		})),
		{
			tagName: "link",
			rel: "alternate",
			hrefLang: "x-default",
			href: absoluteUrl("/"),
		},
	];
}

export function clientLoader() {
	const stored = readStoredLang();
	const lang =
		stored && publishedLanguages.some((l) => l.code === stored)
			? stored
			: pickLang(navigator.languages, publishedLanguages);
	throw redirect(`/${lang}/`);
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
	return <LanguageList />;
}

export default function LanguagePicker() {
	return <LanguageList />;
}

function LanguageList() {
	return (
		<main className="mx-auto max-w-sm p-6 pt-16">
			<h1 className="text-2xl font-semibold">Long Walks Atlas</h1>
			<ul className="mt-6 grid grid-cols-2 gap-2">
				{publishedLanguages.map((l) => (
					<li key={l.code}>
						<Link
							to={`/${l.code}/`}
							lang={l.code}
							hrefLang={l.code}
							className="block rounded-lg px-3 py-2 hover:bg-soft"
						>
							{l.name}
						</Link>
					</li>
				))}
			</ul>
		</main>
	);
}
