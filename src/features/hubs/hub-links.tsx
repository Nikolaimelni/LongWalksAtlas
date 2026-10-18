import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useLang } from "~/features/i18n/use-lang";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { type Hub, hubPath } from "./hubs";

type Props = {
	hubs: readonly Hub[];
	current?: Hub;
	className?: string;
};

export function HubLinks({ hubs, current, className }: Props) {
	const { t } = useTranslation();
	const lang = useLang();
	const format = useTrailFormat();
	if (hubs.length === 0) return null;

	const label = (hub: Hub) =>
		hub.kind === "country"
			? format.country(hub.code)
			: t(`trailTypePlural.${hub.type}`);
	const groups = [
		{
			title: t("hub.byCountry"),
			hubs: hubs
				.filter((hub) => hub.kind === "country")
				.sort((a, b) => label(a).localeCompare(label(b), lang)),
		},
		{ title: t("hub.byType"), hubs: hubs.filter((hub) => hub.kind === "type") },
	].filter((group) => group.hubs.length > 0);
	const currentPath = current ? hubPath(current) : null;

	return (
		<nav aria-label={t("hub.browse")} className={className}>
			{groups.map((group) => (
				<div key={group.title} className="mt-3 first:mt-0">
					<h2 className="text-xs font-medium text-muted">{group.title}</h2>
					<ul className="mt-1 flex flex-wrap gap-x-1 text-sm">
						{group.hubs.map((hub) => (
							<li key={hubPath(hub)}>
								<Link
									to={`/${lang}/${hubPath(hub)}`}
									viewTransition
									aria-current={
										hubPath(hub) === currentPath ? "page" : undefined
									}
									className="inline-block rounded-md px-1.5 py-1.5 underline hover:bg-soft aria-[current=page]:font-semibold aria-[current=page]:no-underline"
								>
									{label(hub)}
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}
