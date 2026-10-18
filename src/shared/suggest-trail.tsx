import { Trans, useTranslation } from "react-i18next";
import { trailsIndex } from "~/features/trails/trails-index";
import { contactEmail } from "./site";

export function SuggestTrail({ className }: { className?: string }) {
	const { t } = useTranslation();
	return (
		<div className={className}>
			<p>{t("site.growing", { count: trailsIndex.length })}</p>
			<p className="mt-1">
				<Trans
					i18nKey="site.suggest"
					values={{ email: contactEmail }}
					components={{
						a: (
							// biome-ignore lint/a11y/useAnchorContent: Trans fills the link with the address
							<a
								href={`mailto:${contactEmail}`}
								className="font-medium text-brand underline"
							/>
						),
					}}
				/>
			</p>
		</div>
	);
}
