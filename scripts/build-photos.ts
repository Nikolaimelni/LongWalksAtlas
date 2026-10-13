import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import type { TrailPhoto } from "../src/features/trails/trail-schema.ts";
import { DataError } from "./data-error.ts";
import { log } from "./log.ts";
import { userAgent } from "./osm/overpass.ts";
import { readTrails } from "./read-trails.ts";

const root = join(import.meta.dirname, "..");
const cacheDir = join(root, "data/cache/photos");
const outDir = join(root, "public/photos");
const indexFile = join(root, "src/generated/photos.json");

const sourceWidth = 1280;
const widths = { small: 640, large: 1280 } as const;

const pageUrl = z.url({
	protocol: /^https$/,
	hostname: /^commons\.wikimedia\.org$/,
});
const thumbUrl = z.url({
	protocol: /^https$/,
	hostname: /^(upload|thumb)\.wikimedia\.org$/,
});
const licenseUrl = z.url({ protocol: /^https?$/ });

const infoSchema = z.object({
	query: z.object({
		pages: z.array(
			z.object({
				title: z.string(),
				missing: z.boolean().optional(),
				imageinfo: z
					.array(
						z.object({
							thumburl: thumbUrl,
							descriptionurl: pageUrl,
							extmetadata: z.record(
								z.string(),
								z.object({ value: z.unknown() }),
							),
						}),
					)
					.optional(),
			}),
		),
	}),
});

const cachedInfoSchema = z.object({
	thumbUrl,
	pageUrl,
	meta: z.record(z.string(), z.string()),
});

type Info = z.infer<typeof cachedInfoSchema>;

export function plainText(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function isUsableLicense(license: string): boolean {
	return license.trim() !== "" && !/\b(NC|ND)\b/.test(license);
}

async function fetchInfo(file: string): Promise<Info> {
	const params = new URLSearchParams({
		action: "query",
		format: "json",
		formatversion: "2",
		titles: file,
		prop: "imageinfo",
		iiprop: "url|extmetadata",
		iiurlwidth: String(sourceWidth),
		iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl",
	});
	const response = await fetch(
		`https://commons.wikimedia.org/w/api.php?${params}`,
		{
			headers: { "User-Agent": userAgent },
		},
	);
	if (!response.ok) {
		throw new DataError("commons-failed", `${file}: HTTP ${response.status}`);
	}
	const parsed = infoSchema.safeParse(await response.json());
	if (!parsed.success) {
		throw new DataError(
			"commons-failed",
			`${file}: ${z.prettifyError(parsed.error)}`,
		);
	}
	const page = parsed.data.query.pages[0];
	const info = page?.imageinfo?.[0];
	if (!page || page.missing || !info) {
		throw new DataError("photo-not-found", `${file} does not exist on Commons`);
	}
	const meta = Object.fromEntries(
		Object.entries(info.extmetadata).map(([k, v]) => [
			k,
			String(v.value ?? ""),
		]),
	);
	return { thumbUrl: info.thumburl, pageUrl: info.descriptionurl, meta };
}

async function cachedInfo(file: string, hash: string): Promise<Info> {
	const path = join(cacheDir, `${hash}.json`);
	if (existsSync(path)) {
		const cached = cachedInfoSchema.safeParse(
			JSON.parse(await readFile(path, "utf8")),
		);
		if (cached.success) return cached.data;
	}
	const info = await fetchInfo(file);
	await writeFile(path, JSON.stringify(info));
	return info;
}

async function cachedImage(url: string, hash: string): Promise<Uint8Array> {
	const path = join(cacheDir, `${hash}.img`);
	if (existsSync(path)) return readFile(path);
	const response = await fetch(url, { headers: { "User-Agent": userAgent } });
	if (!response.ok) {
		throw new DataError("commons-failed", `${url}: HTTP ${response.status}`);
	}
	const image = new Uint8Array(await response.arrayBuffer());
	await writeFile(path, image);
	return image;
}

async function main() {
	const trails = (await readTrails()).filter((t) => t.photo !== null);
	await mkdir(cacheDir, { recursive: true });
	await mkdir(outDir, { recursive: true });
	const photos: Record<string, TrailPhoto> = {};
	const keep = new Set<string>();

	for (const trail of trails) {
		const file = trail.photo?.commons;
		if (!file) continue;
		const hash = createHash("sha1").update(file).digest("hex").slice(0, 10);

		const info = await cachedInfo(file, hash);
		const license = plainText(info.meta.LicenseShortName ?? "");
		if (!isUsableLicense(license)) {
			throw new DataError(
				"photo-license",
				`${file}: licence "${license}" cannot be used`,
			);
		}
		const licenseLink = info.meta.LicenseUrl || null;
		if (licenseLink && !licenseUrl.safeParse(licenseLink).success) {
			throw new DataError(
				"photo-license",
				`${file}: licence link "${licenseLink}" is not a web address`,
			);
		}
		const image = await cachedImage(info.thumbUrl, hash);

		const names = {
			small: `${trail.slug}-${hash}-${widths.small}.webp`,
			large: `${trail.slug}-${hash}-${widths.large}.webp`,
		};
		await sharp(image)
			.resize({ width: widths.small, withoutEnlargement: true })
			.webp({ quality: 65, effort: 6 })
			.toFile(join(outDir, names.small));
		const large = await sharp(image)
			.resize({ width: widths.large, withoutEnlargement: true })
			.webp({ quality: 65, effort: 6 })
			.toFile(join(outDir, names.large));
		keep.add(names.small);
		keep.add(names.large);

		photos[trail.slug] = {
			file,
			author: plainText(info.meta.Artist ?? "") || "Wikimedia Commons",
			license,
			licenseUrl: licenseLink,
			sourceUrl: info.pageUrl,
			width: large.width,
			height: large.height,
			src: { small: `/photos/${names.small}`, large: `/photos/${names.large}` },
		};
		log.info(
			{ slug: trail.slug, license, author: photos[trail.slug]?.author },
			"photo ready",
		);
	}

	for (const name of await readdir(outDir)) {
		if (!keep.has(name)) await rm(join(outDir, name));
	}
	await writeFile(indexFile, `${JSON.stringify(photos, null, "\t")}\n`);
	log.info({ photos: Object.keys(photos).length }, "wrote photos");
}

if (import.meta.main) {
	main().catch((error: unknown) => {
		if (!(error instanceof DataError)) throw error;
		log.error({ code: error.code }, error.message);
		process.exitCode = 1;
	});
}
