import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { useLang } from "~/features/i18n/use-lang";
import { trailsIndex } from "~/features/trails/trails-index";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { type Hub, hasHub, hubPath } from "./hubs";

type Props = { codes: readonly string[] };

// "France, Italy and Switzerland", with each country that has its own page linked to it.
export function CountryList({ codes }: Props) {
	const lang = useLang();
	const format = useTrailFormat();
	const parts = new Intl.ListFormat(lang, {
		type: "conjunction",
	}).formatToParts(codes.map(format.country));

	const nodes: ReactNode[] = [];
	let next = 0;
	for (const part of parts) {
		if (part.type === "literal") {
			nodes.push(
				<Fragment key={`after-${codes[next - 1] ?? "start"}`}>
					{part.value}
				</Fragment>,
			);
			continue;
		}
		const code = codes[next++] ?? "";
		const hub: Hub = { kind: "country", code };
		nodes.push(
			hasHub(hub, trailsIndex) ? (
				<Link
					key={code}
					to={`/${lang}/${hubPath(hub)}`}
					viewTransition
					className="underline"
				>
					{part.value}
				</Link>
			) : (
				<Fragment key={code}>{part.value}</Fragment>
			),
		);
	}
	return nodes;
}
