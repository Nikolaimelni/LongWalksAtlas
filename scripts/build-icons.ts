import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { log } from "./log.ts";

// The logo mark from src/shared/logo-mark.tsx on a solid brand disc, so it reads on a
// light tab bar, a dark one and in the search results list alike.
const brand = "#1d6b57";
const mark = `<path d="M5 17.5c2.6-.6 3.2-4.6 6-5.4s3.6 1.8 6.6-4.2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 3.4"/><circle cx="17.8" cy="7.2" r="2.2" fill="#fff"/>`;

const round = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="${brand}"/>${mark}</svg>\n`;

// iOS rounds the corners itself and fills transparency with black, so the touch icon is
// a full square with the mark inset.
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32"><rect x="-4" y="-4" width="32" height="32" fill="${brand}"/>${mark}</svg>`;

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
const ico = await sharp(Buffer.from(round), { density: 300 })
	.resize(48, 48)
	.png()
	.toBuffer();
const touch = await sharp(Buffer.from(square), { density: 600 })
	.resize(180, 180)
	.png()
	.toBuffer();

await writeFile(join(publicDir, "favicon.svg"), round);
await writeFile(join(publicDir, "favicon.ico"), pngToIco(ico, 48));
await writeFile(join(publicDir, "apple-touch-icon.png"), touch);
log.info("wrote favicon.svg, favicon.ico and apple-touch-icon.png");
