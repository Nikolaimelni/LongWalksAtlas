import { useTranslation } from "react-i18next";
import { hoverPlacement } from "~/features/map/hover-placement";
import type { TrailContent } from "~/features/trails/content-schema";
import { TrailDot } from "~/features/trails/trail-dot";
import { TrailPreview } from "~/features/trails/trail-preview";
import type { TrailPhoto, TrailSummary } from "~/features/trails/trail-schema";
import { trailColor } from "~/features/trails/trail-style";
import { useElementSize } from "~/shared/use-element-size";

type Props = {
	x: number;
	y: number;
	trails: TrailSummary[];
	content: Record<string, TrailContent>;
	photos: Record<string, TrailPhoto>;
	titleOf: (trail: TrailSummary) => string;
};

export function HoverCard({ x, y, trails, content, photos, titleOf }: Props) {
	const { t } = useTranslation();
	const [ref, size] = useElementSize<HTMLDivElement>();
	const [first] = trails;
	if (!first) return null;

	return (
		<div
			ref={ref}
			className="pointer-events-none absolute z-20 w-64 overflow-hidden rounded-xl bg-surface p-3 shadow-float transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none"
			style={hoverPlacement(x, y, size, {
				width: window.innerWidth,
				height: window.innerHeight,
			})}
		>
			{trails.length === 1 ? (
				<TrailPreview
					trail={first}
					content={content[first.slug]}
					photo={photos[first.slug] ?? null}
					variant="hover"
				/>
			) : (
				<>
					<ul className="flex flex-col gap-1.5 text-sm font-medium">
						{trails.map((trail) => (
							<li key={trail.slug} className="flex items-center gap-2">
								<TrailDot color={trailColor(trail.type)} />
								{titleOf(trail)}
							</li>
						))}
					</ul>
					<p className="mt-2 text-xs text-muted">{t("atlas.pickHint")}</p>
				</>
			)}
		</div>
	);
}
