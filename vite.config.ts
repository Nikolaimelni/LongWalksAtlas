import { reactRouter } from "@react-router/dev/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		babel({
			include: /[\\/]src[\\/].*\.tsx?$/,
			plugins: ["babel-plugin-react-compiler"],
		}),
		tailwindcss(),
		reactRouter(),
	],
	resolve: {
		tsconfigPaths: true,
	},
	build: {
		chunkSizeWarningLimit: 1200,
	},
	// Only the prerender step runs vite preview (`pnpm preview` is serve-static.ts). On
	// "localhost" it listens on ::1 alone, and once a couple of thousand pages have gone
	// through, a connect to ::1 sometimes takes longer than Node's 250 ms happy-eyeballs
	// window; the fallback to 127.0.0.1 is refused and the build dies on a random page.
	preview: {
		host: "127.0.0.1",
	},
	// During that same preview React Router starts a child Vite server that watches the
	// whole project with this setting. It does not know build/ is the output, so it put
	// a watcher on every folder the prerender wrote and stalled the server for minutes.
	server: {
		watch: { ignored: ["**/build/**", "**/data/cache/**"] },
	},
});
