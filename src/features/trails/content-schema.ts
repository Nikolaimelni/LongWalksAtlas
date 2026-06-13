import { z } from "zod";
import type { Lang } from "../i18n/languages.ts";

export const contentFrontmatterSchema = z.strictObject({
	title: z.string().min(1).max(120),
	summary: z.string().min(1).max(300),
	status: z.enum(["machine", "reviewed"]),
});

export type TrailContent = z.infer<typeof contentFrontmatterSchema> & {
	lang: Lang;
};
