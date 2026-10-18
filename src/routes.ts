import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/language-redirect.tsx"),
	route("sitemap.xml", "routes/sitemap.ts"),
	route("llms.txt", "routes/llms.ts"),
	route(":lang", "routes/lang-layout.tsx", [
		index("routes/atlas.tsx"),
		route("trail/:slug", "routes/trail.tsx"),
		route(":kind/:key", "routes/hub.tsx"),
		route("og-card", "routes/og-card.tsx"),
		route("og-card/trail/:slug", "routes/og-trail-card.tsx"),
	]),
] satisfies RouteConfig;
