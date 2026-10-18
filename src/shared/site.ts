export const siteUrl = "https://longwalksatlas.com";

export function absoluteUrl(path: string): string {
	return new URL(path, siteUrl).href;
}

export const contactEmail = "hello@longwalksatlas.com";

// Cloudflare Web Analytics: no cookies, so no consent banner. The token is public; it
// ends up in every page anyway.
export const webAnalyticsToken = "59c07b7fab6840bc9afa8ec3b0aef789";
