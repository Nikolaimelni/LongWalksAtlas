import { useParams } from "react-router";
import { defaultLang, isLang, type Lang } from "./languages";

export function useLang(): Lang {
	const { lang } = useParams();
	return isLang(lang) ? lang : defaultLang;
}
