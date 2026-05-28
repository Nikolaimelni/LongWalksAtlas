import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { isLang, languages, swapLang } from "./languages";
import { storeLang } from "./stored-lang";
import { useLang } from "./use-lang";

export function LanguageSwitcher() {
	const { t } = useTranslation();
	const lang = useLang();
	const location = useLocation();
	const navigate = useNavigate();

	function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
		const next = event.target.value;
		if (!isLang(next)) return;
		storeLang(next);
		void navigate(swapLang(location.pathname, next) + location.search);
	}

	return (
		<label className="relative">
			<span className="sr-only">{t("language.label")}</span>
			<select
				value={lang}
				onChange={handleChange}
				className="h-10 appearance-none rounded-full bg-white/90 ps-4 pe-4 text-sm shadow-md backdrop-blur focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 dark:bg-stone-900/90 dark:focus-visible:outline-stone-100"
			>
				{languages.map((l) => (
					<option key={l.code} value={l.code} lang={l.code}>
						{l.name}
					</option>
				))}
			</select>
		</label>
	);
}
