import { z } from "zod";
import { DataError } from "./data-error.ts";

const schema = z.object({
	OVERPASS_URLS: z
		.string()
		.default(
			"https://overpass-api.de/api/interpreter,https://overpass.private.coffee/api/interpreter",
		)
		.transform((value) =>
			value
				.split(",")
				.map((url) => url.trim())
				.filter(Boolean),
		)
		.pipe(z.array(z.url()).min(1)),
	LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
	DEEPL_API_KEY: z.string().min(1).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
	throw new DataError(
		"invalid-env",
		`Invalid environment:\n${z.prettifyError(parsed.error)}`,
	);
}

export const env = parsed.data;
