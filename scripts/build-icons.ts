import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { log } from "./log.ts";

// A plainer src/shared/logo-mark.tsx: the trail is a solid line, because its dotted one
// turns to noise at 16 px.
const brand = "#155445";
const mark =
	'<path d="M4 24 13 10l4 5.5 3-4 8 12.5Z" fill="#2a6b5a"/><path d="M6 27c4-1 5-4 9-5s4-4 5-8" fill="none" stroke="#fbf5e6" stroke-width="2" stroke-linecap="round"/><circle cx="25" cy="7" r="2.6" fill="#cd8b4b"/>';

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>Long Walks Atlas</title><rect width="32" height="32" rx="7" fill="${brand}"/>${mark}</svg>\n`;

// iOS rounds the corners itself and fills transparency with black, so the touch icon is
// a full square with the mark inset.
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 36 36"><rect x="-2" y="-2" width="36" height="36" fill="${brand}"/>${mark}</svg>`;

const publicDir = join(import.meta.dirname, "../public");

// An .ico may hold PNG data as is: a 6-byte header, one 16-byte directory entry, the PNG.
function pngToIco(png: Buffer, size: number): Buffer {
	const header = Buffer.alloc(22);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(1, 4);
	header.writeUInt8(size, 6);
	header.writeUInt8(size, 7);
	header.writeUInt16LE(1, 10);
	header.writeUInt16LE(32, 12);
	header.writeUInt32LE(png.length, 14);
	header.writeUInt32LE(22, 18);
	return Buffer.concat([header, png]);
}

// Google wants a favicon whose side is a multiple of 48 px.
const ico = await sharp(Buffer.from(rounded), { density: 300 })
	.resize(48, 48)
	.png()
	.toBuffer();
const touch = await sharp(Buffer.from(square), { density: 600 })
	.resize(180, 180)
	.png()
	.toBuffer();

await writeFile(join(publicDir, "favicon.svg"), rounded);
await writeFile(join(publicDir, "favicon.ico"), pngToIco(ico, 48));
await writeFile(join(publicDir, "apple-touch-icon.png"), touch);
log.info("wrote favicon.svg, favicon.ico and apple-touch-icon.png");
