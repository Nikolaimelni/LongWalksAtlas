import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
	options: { port: { type: "string", default: "4173" } },
});
const root = join(import.meta.dirname, "../build/client");

const types: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript",
	".mjs": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".geojson": "application/geo+json",
	".data": "text/x-script",
	".xml": "application/xml; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".webp": "image/webp",
};

const isFile = (path: string) => existsSync(path) && statSync(path).isFile();

function send(
	res: import("node:http").ServerResponse,
	file: string,
	status = 200,
) {
	res.writeHead(status, {
		"Content-Type": types[extname(file)] ?? "application/octet-stream",
	});
	createReadStream(file).pipe(res);
}

createServer((req, res) => {
	const url = new URL(req.url ?? "/", "http://localhost");
	const path = normalize(decodeURIComponent(url.pathname));
	const file = join(root, path);
	if (!file.startsWith(root)) return send(res, join(root, "404.html"), 404);

	if (isFile(file)) return send(res, file);
	if (isFile(join(file, "index.html"))) {
		if (url.pathname.endsWith("/")) return send(res, join(file, "index.html"));
		res.writeHead(308, { Location: `${url.pathname}/${url.search}` });
		return res.end();
	}
	send(res, join(root, "404.html"), 404);
}).listen(Number(values.port), () => {
	process.stdout.write(
		`serving build/client on http://localhost:${values.port}\n`,
	);
});
