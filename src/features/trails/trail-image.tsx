import { useTranslation } from "react-i18next";
import type { TrailPhoto } from "./trail-schema";

type Props = {
	photo: TrailPhoto | null;
	color: string;
	alt: string;
	className: string;
	sizes: string;
	eager?: boolean;
	morph?: boolean;
};

export function TrailImage({
	photo,
	color,
	alt,
	className,
	sizes,
	eager,
	morph,
}: Props) {
	const { t } = useTranslation();
	const viewTransitionName = morph ? "trail-photo" : undefined;
	if (!photo) {
		return (
			<div
				className={className}
				style={{
					background: `linear-gradient(135deg, ${color}, ${color}66)`,
					viewTransitionName,
				}}
				role="presentation"
			/>
		);
	}
	return (
		<figure>
			<img
				src={photo.src.small}
				srcSet={`${photo.src.small} 640w, ${photo.src.large} 1280w`}
				sizes={sizes}
				width={photo.width}
				height={photo.height}
				alt={alt}
				loading={eager ? "eager" : "lazy"}
				decoding="async"
				className={`${className} object-cover`}
				style={{ background: color, viewTransitionName }}
			/>
			<figcaption className="mt-1 truncate text-[11px] text-stone-500">
				{t("trail.photoBy")}{" "}
				<a href={photo.sourceUrl} rel="noopener" className="underline">
					{photo.author}
				</a>
				{", "}
				{photo.licenseUrl ? (
					<a
						href={photo.licenseUrl}
						rel="noopener license"
						className="underline"
					>
						{photo.license}
					</a>
				) : (
					photo.license
				)}
			</figcaption>
		</figure>
	);
}
