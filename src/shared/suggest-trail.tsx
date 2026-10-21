import { Trans, useTranslation } from "react-i18next";
import { trailsIndex } from "~/features/trails/trails-index";
import { EmailLink } from "./email-link";
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
					components={{ a: <EmailLink /> }}
				/>
			</p>
		</div>
	);
}
