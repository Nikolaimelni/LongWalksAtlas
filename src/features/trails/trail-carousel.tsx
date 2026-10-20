import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrailImage } from "./trail-image";
import type { TrailPhoto } from "./trail-schema";

type Props = { photos: TrailPhoto[]; color: string; alt: string };

export function TrailCarousel({ photos, color, alt }: Props) {
	const { t } = useTranslation();
	const slides = useRef<(Element | null)[]>([]);
	const [current, setCurrent] = useState(0);

	// DOM layout: the slide in view.
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const index = slides.current.indexOf(entry.target);
					if (index !== -1) setCurrent(index);
				}
			},
			{ threshold: 0.6 },
		);
		for (const slide of slides.current) if (slide) observer.observe(slide);
		return () => observer.disconnect();
	}, []);

	const show = (index: number) =>
		slides.current[index]?.scrollIntoView({
			block: "nearest",
			inline: "start",
		});

	const arrow =
		"pointer-events-auto hidden size-11 cursor-pointer place-items-center rounded-full bg-surface/90 text-xl shadow-float backdrop-blur transition-opacity hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-0 pointer-fine:grid";

	return (
		<section aria-roledescription="carousel" aria-label={t("trail.photos")}>
			<div className="relative">
				<ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden">
					{photos.map((photo, index) => (
						<li
							key={photo.file}
							ref={(node) => {
								slides.current[index] = node;
							}}
							aria-roledescription="slide"
							aria-label={t("trail.photoN", {
								n: index + 1,
								total: photos.length,
							})}
							className="w-full shrink-0 snap-start snap-always"
						>
							<TrailImage
								photo={photo}
								color={color}
								alt={alt}
								className="aspect-[16/9] w-full rounded-2xl"
								sizes="(min-width: 1024px) 720px, 100vw"
								eager={index === 0}
								morph={index === 0}
							/>
						</li>
					))}
				</ul>
				<div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[16/9] items-center justify-between px-3">
					<button
						type="button"
						onClick={() => show(current - 1)}
						disabled={current === 0}
						aria-label={t("trail.prevPhoto")}
						className={arrow}
					>
						<span aria-hidden="true" className="rtl:-scale-x-100">
							‹
						</span>
					</button>
					<button
						type="button"
						onClick={() => show(current + 1)}
						disabled={current === photos.length - 1}
						aria-label={t("trail.nextPhoto")}
						className={arrow}
					>
						<span aria-hidden="true" className="rtl:-scale-x-100">
							›
						</span>
					</button>
				</div>
			</div>
			<div className="mt-2 flex justify-center gap-1">
				{photos.map((photo, index) => (
					<button
						key={photo.file}
						type="button"
						onClick={() => show(index)}
						aria-label={t("trail.photoN", {
							n: index + 1,
							total: photos.length,
						})}
						aria-current={index === current || undefined}
						className="group grid size-6 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-brand"
					>
						<span className="size-2 rounded-full bg-line transition-colors group-hover:bg-muted group-aria-current:bg-brand" />
					</button>
				))}
			</div>
		</section>
	);
}
