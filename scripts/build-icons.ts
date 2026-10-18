import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { log } from "./log.ts";

// A plainer src/shared/logo-mark.tsx: one line and one pin on a folded map, because the
// full logo turns to noise at 16 px.
const brand = "#155445";
const map = `<path d="m4.5 9 7.5-2.5 8 2.5 7.5-2.5v17L20 26l-8-2.5-7.5 2.5Z" fill="#fbf5e6"/><path d="m12 6.5 8 2.5v17l-8-2.5Z" fill="#e6dbc3"/><path d="M8 22c2-3 4.5-1.5 7-4s3.5-3 6-3" fill="none" stroke="#1d6b57" stroke-width="2" stroke-linecap="round"/><path d="M21.5 18.2c-1.2-1.6-3.2-3.5-3.2-5.6a3.2 3.2 0 0 1 6.4 0c0 2.1-2 4-3.2 5.6Z" fill="#e5533d"/><circle cx="21.5" cy="12.6" r="1.2" fill="#fbf5e6"/>`;

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>Long Walks Atlas</title><rect width="32" height="32" rx="7" fill="${brand}"/>${map}</svg>\n`;

// iOS rounds the corners itself and fills transparency with black, so the touch icon is
// a full square with the map inset.
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 36 36"><rect x="-2" y="-2" width="36" height="36" fill="${brand}"/>${map}</svg>`;

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
