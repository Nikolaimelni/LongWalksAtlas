export const siteUrl = "https://longwalksatlas.com";

export function absoluteUrl(path: string): string {
	return new URL(path, siteUrl).href;
}
