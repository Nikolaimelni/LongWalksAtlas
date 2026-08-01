import { I18nextProvider } from "react-i18next";
import { data, Outlet } from "react-router";
import { getI18n } from "~/features/i18n/i18n";
import { isLang } from "~/features/i18n/languages";
import { loadMessages } from "~/features/i18n/messages";
import { prerenderedOnly } from "~/shared/prerendered-only";
import { revalidateOnPathChange } from "~/shared/same-path";
import type { Route } from "./+types/lang-layout";

export async function loader({ params }: Route.LoaderArgs) {
	if (!isLang(params.lang)) throw data("Unknown language", { status: 404 });
	return { lang: params.lang, messages: await loadMessages(params.lang) };
}

export const clientLoader = ({ serverLoader }: Route.ClientLoaderArgs) =>
	prerenderedOnly(serverLoader);

export const shouldRevalidate = revalidateOnPathChange;

export default function LangLayout({ loaderData }: Route.ComponentProps) {
	return (
		<I18nextProvider i18n={getI18n(loaderData.lang, loaderData.messages)}>
			<Outlet />
		</I18nextProvider>
	);
}
