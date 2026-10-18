import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import "@fontsource-variable/noto-sans";
import "@fontsource-variable/noto-serif";
import sansCyrillic from "@fontsource-variable/noto-sans/files/noto-sans-cyrillic-wght-normal.woff2?url";
import sansLatinExt from "@fontsource-variable/noto-sans/files/noto-sans-latin-ext-wght-normal.woff2?url";
import sansLatin from "@fontsource-variable/noto-sans/files/noto-sans-latin-wght-normal.woff2?url";
import serifCyrillic from "@fontsource-variable/noto-serif/files/noto-serif-cyrillic-wght-normal.woff2?url";
import serifLatinExt from "@fontsource-variable/noto-serif/files/noto-serif-latin-ext-wght-normal.woff2?url";
import serifLatin from "@fontsource-variable/noto-serif/files/noto-serif-latin-wght-normal.woff2?url";
import { type Lang, langDir } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import { trailColorCss } from "~/features/trails/trail-style";
import { LogoMark } from "~/shared/logo-mark";
import type { Route } from "./+types/root";
import "./app.css";

// The site name and headings are serif, the rest sans, so every page needs both in Latin
// plus the subset its own letters live in: ł and ş are latin-ext, ї and ы cyrillic.
const scriptFonts: Partial<Record<Lang, string[]>> = {
	ru: [sansCyrillic, serifCyrillic],
	uk: [sansCyrillic, serifCyrillic],
	pl: [sansLatinExt, serifLatinExt],
	tr: [sansLatinExt, serifLatinExt],
};

// why: Vite turns each JSON key into a named export, so this pulls only the few
// error strings of every language into the root chunk, not the whole message files.
const errorText = import.meta.glob<{
	notFound: string;
	notFoundText: string;
	crashed: string;
	crashedText: string;
	home: string;
}>("./locales/*.json", { eager: true, import: "error" });

export function Layout({ children }: { children: React.ReactNode }) {
	const lang = useLang();
	const preload = [sansLatin, serifLatin, ...(scriptFonts[lang] ?? [])];
	return (
		<html lang={lang} dir={langDir(lang)}>
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, viewport-fit=cover"
				/>
				<meta name="color-scheme" content="light dark" />
				<style>{trailColorCss()}</style>
				<meta
					name="theme-color"
					content="#f7f3ea"
					media="(prefers-color-scheme: light)"
				/>
				<meta
					name="theme-color"
					content="#11161c"
					media="(prefers-color-scheme: dark)"
				/>
				<link rel="icon" href="/favicon.ico" sizes="48x48" />
				<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				{preload.map((href) => (
					<link
						key={href}
						rel="preload"
						as="font"
						type="font/woff2"
						crossOrigin="anonymous"
						href={href}
					/>
				))}
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

// The language layout's loader fails along with the page, so its messages are not there;
// the error page takes its few words from the glob above instead.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	const lang = useLang();
	const text =
		errorText[`./locales/${lang}.json`] ?? errorText["./locales/en.json"];
	const crashed =
		error instanceof Error ||
		(isRouteErrorResponse(error) && error.status >= 500);
	const heading = crashed ? text?.crashed : text?.notFound;
	const home = `/${lang}/`;
	return (
		<main className="grid min-h-dvh place-items-center px-4 py-16">
			<title>{`${heading} · Long Walks Atlas`}</title>
			<div className="flex w-full max-w-md flex-col items-center text-center">
				<a
					href={home}
					className="flex items-center gap-2 rounded-full py-1 ps-1 pe-3 font-serif text-sm font-semibold hover:bg-soft"
				>
					<LogoMark className="size-8 text-brand" />
					Long Walks Atlas
				</a>
				<DeadEnd className="mt-12 h-28 w-full max-w-72 text-brand" />
				<p className="mt-4 text-sm font-medium tracking-widest text-muted uppercase">
					{crashed ? "500" : "404"}
				</p>
				<h1 className="mt-2 font-serif text-3xl leading-tight font-semibold text-balance">
					{heading}
				</h1>
				<p className="mt-3 leading-relaxed text-pretty text-muted">
					{crashed ? text?.crashedText : text?.notFoundText}
				</p>
				<a
					href={home}
					className="mt-8 rounded-full bg-brand px-6 py-3 font-semibold text-on-brand hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					{text?.home}
				</a>
				{import.meta.env.DEV && error instanceof Error && (
					<pre className="mt-8 w-full overflow-x-auto text-start text-xs">
						{error.stack}
					</pre>
				)}
			</div>
		</main>
	);
}

function DeadEnd({ className }: { className: string }) {
	return (
		<svg viewBox="0 0 240 96" aria-hidden="true" className={className}>
			<path
				d="M8 78c30-6 34-40 66-44s40 26 70 20 26-30 48-34"
				fill="none"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="round"
				strokeDasharray="0.1 11"
			/>
			<path
				d="M196 20c10-2 18 2 26 8"
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.25"
				strokeWidth="4"
				strokeLinecap="round"
				strokeDasharray="0.1 11"
			/>
			<circle cx="8" cy="78" r="6" fill="currentColor" />
			<path
				d="M185 8l14 26"
				stroke="currentColor"
				strokeWidth="6"
				strokeLinecap="round"
			/>
		</svg>
	);
}
