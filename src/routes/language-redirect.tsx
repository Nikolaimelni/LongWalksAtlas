import { Link, redirect } from "react-router";
import { languages, pickLang } from "~/features/i18n/languages";
import { readStoredLang } from "~/features/i18n/stored-lang";

export function clientLoader() {
	const stored = readStoredLang();
	throw redirect(`/${stored ?? pickLang(navigator.languages)}/`);
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
				{languages.map((l) => (
					<li key={l.code}>
						<Link
							to={`/${l.code}/`}
							lang={l.code}
							hrefLang={l.code}
							className="block rounded-lg px-3 py-2 hover:bg-stone-100 dark:hover:bg-stone-800"
						>
							{l.name}
						</Link>
					</li>
				))}
			</ul>
		</main>
	);
}
