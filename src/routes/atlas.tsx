import type { Route } from "./+types/atlas";

export function meta(_: Route.MetaArgs) {
	return [{ title: "Long Walks Atlas" }];
}

export default function Atlas() {
	return (
		<main className="grid min-h-dvh place-items-center p-4">
			<h1 className="text-2xl font-semibold">Long Walks Atlas</h1>
		</main>
	);
}
