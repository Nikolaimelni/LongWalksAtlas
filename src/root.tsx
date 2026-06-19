import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import { langDir } from "~/features/i18n/languages";
import { useLang } from "~/features/i18n/use-lang";
import type { Route } from "./+types/root";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
	const lang = useLang();
	return (
		<html lang={lang} dir={langDir(lang)}>
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, viewport-fit=cover"
				/>
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

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	const crashed =
		error instanceof Error ||
		(isRouteErrorResponse(error) && error.status >= 500);
	return (
		<main className="mx-auto max-w-prose p-4 pt-16">
			<h1 className="text-2xl font-semibold">
				{crashed ? "Something went wrong" : "Page not found"}
			</h1>
			<p className="mt-4">
				<a href="/" className="underline">
					Go to the map of all trails
				</a>
			</p>
			{import.meta.env.DEV && error instanceof Error && (
				<pre className="mt-4 overflow-x-auto text-sm">{error.stack}</pre>
			)}
		</main>
	);
}
