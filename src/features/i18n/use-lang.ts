import { useLocation, useParams } from "react-router";
import { defaultLang, isLang, type Lang } from "./languages";

export function useLang(): Lang {
	const { lang } = useParams();
	const { pathname } = useLocation();
	// An address that matches no route has no :lang, but its first segment still says
	// which language the visitor was reading, and the 404 should answer in it.
	const wanted = lang ?? pathname.split("/")[1];
	return isLang(wanted) ? wanted : defaultLang;
}
