import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { TrailPhoto } from "./trail-schema";

type Props = {
	photo: TrailPhoto | null;
	color: string;
	alt: string;
	className: string;
	sizes: string;
	eager?: boolean;
	morph?: boolean;
	href?: string | undefined;
};

export function TrailImage({
	photo,
	color,
	alt,
	className,
	sizes,
	eager,
	morph,
	href,
}: Props) {
	const { t } = useTranslation();
	const viewTransitionName = morph ? "trail-photo" : undefined;
	const linked = (picture: ReactNode) =>
		href ? (
			<Link to={href} viewTransition tabIndex={-1} className="block">
				{picture}
			</Link>
		) : (
			picture
		);
	if (!photo) {
		return linked(
			<div
				className={className}
				style={{
					background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 40%, transparent))`,
					viewTransitionName,
				}}
				role="presentation"
			/>,
		);
	}
	return (
		<figure>
			{linked(
				<img
					src={photo.src.small}
					srcSet={`${photo.src.small} ${photo.smallWidth}w, ${photo.src.large} ${photo.width}w`}
					sizes={sizes}
					width={photo.width}
					height={photo.height}
					alt={alt}
					loading={eager ? "eager" : "lazy"}
					decoding="async"
					className={`${className} object-cover`}
					style={{ background: color, viewTransitionName }}
				/>,
			)}
			<figcaption className="mt-1 text-xs [overflow-wrap:anywhere] text-muted">
				{t("trail.photoBy")}{" "}
				<a
					href={photo.sourceUrl}
					target="_blank"
					rel="noopener"
					className="underline"
				>
					{photo.author}
				</a>
				{", "}
				{photo.licenseUrl ? (
					<a
						href={photo.licenseUrl}
						target="_blank"
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
