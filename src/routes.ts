import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/language-redirect.tsx"),
	route(":lang", "routes/lang-layout.tsx", [index("routes/atlas.tsx")]),
] satisfies RouteConfig;
