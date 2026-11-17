import type { Position } from "geojson";
import { haversineKm } from "./main-line.ts";

type Line = Position[];
type Box = [number, number, number, number];
type Candidate = { km: number; a: number; b: number; line: Line };

const kmPerDegLat = 110.57;
const kmPerDegLng = 111.32;

function boxOf(line: Line): Box {
	let [west, south, east, north] = [180, 90, -180, -90];
	for (const [lng = 0, lat = 0] of line) {
		west = Math.min(west, lng);
		south = Math.min(south, lat);
		east = Math.max(east, lng);
		north = Math.max(north, lat);
	}
	return [west, south, east, north];
}

function farFromBox([lng = 0, lat = 0]: Position, box: Box, km: number) {
	const [west, south, east, north] = box;
	const dx = Math.max(west - lng, 0, lng - east);
	const dy = Math.max(south - lat, 0, lat - north);
	const kx = Math.cos((lat * Math.PI) / 180) * kmPerDegLng;
	return Math.hypot(dx * kx, dy * kmPerDegLat) > km * 1.01;
}

function nearestOnSegment(p: Position, a: Position, b: Position): Position {
	const [px = 0, py = 0] = p;
	const [ax = 0, ay = 0] = a;
	const [bx = 0, by = 0] = b;
	const kx = Math.cos((py * Math.PI) / 180);
	const dx = (bx - ax) * kx;
	const dy = by - ay;
	const len2 = dx * dx + dy * dy;
	const t =
		len2 === 0
			? 0
			: Math.max(0, Math.min(1, ((px - ax) * kx * dx + (py - ay) * dy) / len2));
	return [ax + t * (bx - ax), ay + t * (by - ay)];
}

function nearestOn(p: Position, line: Line) {
	let best = { km: Number.POSITIVE_INFINITY, point: p };
	for (let i = 1; i < line.length; i++) {
		const a = line[i - 1];
		const b = line[i];
		if (!a || !b) continue;
		const point = nearestOnSegment(p, a, b);
		const km = haversineKm(p, point);
		if (km < best.km) best = { km, point };
	}
	return best;
}

export function gapLines(
	lines: readonly Line[],
	maxKm: number,
	minKm = 0.05,
): Line[] {
	if (lines.length < 2) return [];
	const boxes = lines.map(boxOf);
	const candidates: Candidate[] = [];
	lines.forEach((line, a) => {
		for (const end of [line[0], line.at(-1)]) {
			if (!end) continue;
			lines.forEach((other, b) => {
				const box = boxes[b];
				if (b === a || !box || farFromBox(end, box, maxKm)) return;
				const { km, point } = nearestOn(end, other);
				if (km <= maxKm) candidates.push({ km, a, b, line: [end, point] });
			});
		}
	});
	candidates.sort((x, y) => x.km - y.km);

	const parent = lines.map((_, i) => i);
	const find = (i: number): number => {
		let root = i;
		while (parent[root] !== root) root = parent[root] ?? root;
		parent[i] = root;
		return root;
	};

	const gaps: Line[] = [];
	for (const { km, a, b, line } of candidates) {
		const ra = find(a);
		const rb = find(b);
		if (ra === rb) continue;
		parent[ra] = rb;
		if (km >= minKm) gaps.push(line);
	}
	return gaps;
}
