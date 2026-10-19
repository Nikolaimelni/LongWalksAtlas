import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { useLang } from "~/features/i18n/use-lang";
import { trailsIndex } from "~/features/trails/trails-index";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { Flag } from "./flag";
import { type Hub, hasHub, hubPath } from "./hubs";

type Props = { codes: readonly string[]; linked?: boolean };

export function CountryList({ codes, linked = true }: Props) {
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
		// The flag stays on the line of its name.
		const name = (
			<>
				<Flag code={code} className="me-1" />
				{part.value}
			</>
		);
		nodes.push(
			linked && hasHub(hub, trailsIndex) ? (
				<Link
					key={code}
					to={`/${lang}/${hubPath(hub)}`}
					viewTransition
					className="whitespace-nowrap underline"
				>
					{name}
				</Link>
			) : (
				<span key={code} className="whitespace-nowrap">
					{name}
				</span>
			),
		);
	}
	return nodes;
}
