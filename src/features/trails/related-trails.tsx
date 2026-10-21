import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useLang } from "~/features/i18n/use-lang";
import type { TrailType } from "./trail-schema";
import { trailColor } from "./trail-style";
import { useTrailFormat } from "./use-trail-format";

export type RelatedTrail = {
	slug: string;
	type: TrailType;
	lengthKm: number;
	title: string;
};

type Props = {
	related: { crosses: RelatedTrail[]; nearby: RelatedTrail[] };
	className?: string;
};

export function RelatedTrails({ related, className = "" }: Props) {
	const { t } = useTranslation();
	const lang = useLang();
	const format = useTrailFormat();
	const kinds = (["crosses", "nearby"] as const).filter(
		(kind) => related[kind].length > 0,
	);
	if (kinds.length === 0) return null;

	return (
		<div className={`flex flex-col gap-10 ${className}`}>
			{kinds.map((kind) => (
				<section key={kind} aria-labelledby={kind}>
					<h2 id={kind} className="font-display text-xl font-semibold">
						{t(`trail.${kind}`)}
					</h2>
					<ul className="mt-3 grid gap-2 sm:grid-cols-2">
						{related[kind].map((other) => (
							<li key={other.slug}>
								<Link
									to={`/${lang}/trail/${other.slug}/`}
									viewTransition
									className="flex h-full items-center gap-3 rounded-xl border border-line px-4 py-3 hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand"
								>
									<span
										className="inline-block h-8 w-1 shrink-0 rounded-full"
										style={{ background: trailColor(other.type) }}
									/>
									<span>
										<span className="block font-medium">{other.title}</span>
										<span className="block text-sm text-muted">
											{t(`trailType.${other.type}`)} ·{" "}
											{format.km(other.lengthKm)}
										</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}
