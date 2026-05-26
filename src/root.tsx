import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
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
	const notFound = isRouteErrorResponse(error) && error.status === 404;
	return (
		<main className="mx-auto max-w-prose p-4 pt-16">
			<h1 className="text-2xl font-semibold">
				{notFound ? "Page not found" : "Something went wrong"}
			</h1>
			{import.meta.env.DEV && error instanceof Error && (
				<pre className="mt-4 overflow-x-auto text-sm">{error.stack}</pre>
			)}
		</main>
	);
}
