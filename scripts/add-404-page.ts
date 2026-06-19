import { copyFile } from "node:fs/promises";
import { join } from "node:path";

const client = join(import.meta.dirname, "../build/client");
await copyFile(join(client, "__spa-fallback.html"), join(client, "404.html"));
