import type { Config } from "@react-router/dev/config";
import { languages } from "./src/features/i18n/languages";

export default {
	appDirectory: "src",
	ssr: false,
	prerender: ["/", ...languages.map(({ code }) => `/${code}/`)],
} satisfies Config;
