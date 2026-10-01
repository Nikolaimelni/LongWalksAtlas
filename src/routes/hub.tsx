import { data } from "react-router";
import { loadHub } from "~/features/hubs/hub-data";
import { hubMeta } from "~/features/hubs/hub-meta";
import { HubPage } from "~/features/hubs/hub-page";
import { countryHub, typeHub } from "~/features/hubs/hubs";
import { isLang } from "~/features/i18n/languages";
import { trailsIndex } from "~/features/trails/trails-index";
import { prerenderedOnly } from "~/shared/prerendered-only";
import type { Route } from "./+types/hub";

export async function loader({ params }: Route.LoaderArgs) {
	if (!isLang(params.lang)) throw data("Unknown language", { status: 404 });
	const hub =
		params.kind === "country"
			? countryHub(params.key, trailsIndex)
			: params.kind === "type"
				? typeHub(params.key, trailsIndex)
				: null;
	if (!hub) throw data("No such page", { status: 404 });
	return loadHub(hub, params.lang);
}

export const clientLoader = ({ serverLoader }: Route.ClientLoaderArgs) =>
	prerenderedOnly(serverLoader);

export function meta({ loaderData, matches }: Route.MetaArgs) {
	const layout = matches[1]?.loaderData;
	if (!loaderData || !layout) return [];
	return hubMeta(loaderData, layout.lang, layout.messages);
}

export default function Hub({ loaderData }: Route.ComponentProps) {
	return <HubPage data={loaderData} />;
}
