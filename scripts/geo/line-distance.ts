import type { Position } from "geojson";

type Segment = [Position, Position];

const kmPerDegLat = 110.57;

function pointSegmentKm(p: Position, [a, b]: Segment): number {
	const [px = 0, py = 0] = p;
	const kx = Math.cos((py * Math.PI) / 180) * 111.32;
	const ax = ((a[0] ?? 0) - px) * kx;
	const ay = ((a[1] ?? 0) - py) * kmPerDegLat;
	const bx = ((b[0] ?? 0) - px) * kx;
	const by = ((b[1] ?? 0) - py) * kmPerDegLat;
	const dx = bx - ax;
	const dy = by - ay;
	const len2 = dx * dx + dy * dy;
	const t =
		len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
	return Math.hypot(ax + t * dx, ay + t * dy);
}

function orientation(a: Position, b: Position, c: Position): number {
	return Math.sign(
		((b[0] ?? 0) - (a[0] ?? 0)) * ((c[1] ?? 0) - (a[1] ?? 0)) -
			((b[1] ?? 0) - (a[1] ?? 0)) * ((c[0] ?? 0) - (a[0] ?? 0)),
	);
}

function crosses([a, b]: Segment, [c, d]: Segment): boolean {
	return (
		orientation(a, b, c) * orientation(a, b, d) < 0 &&
		orientation(c, d, a) * orientation(c, d, b) < 0
	);
}

function segmentKm(s: Segment, t: Segment): number {
	if (crosses(s, t)) return 0;
	return Math.min(
		pointSegmentKm(s[0], t),
		pointSegmentKm(s[1], t),
		pointSegmentKm(t[0], s),
		pointSegmentKm(t[1], s),
	);
}

function segmentsOf(lines: Position[][]): Segment[] {
	return lines.flatMap((line) =>
		line.slice(1).flatMap((b, i) => {
			const a = line[i];
			return a ? [[a, b] as Segment] : [];
		}),
	);
}

export function lineDistanceKm(
	a: Position[][],
	b: Position[][],
	maxKm: number,
): number | null {
	const cell = maxKm / kmPerDegLat;
	const cellsOf = (
		[[ax = 0, ay = 0], [bx = 0, by = 0]]: Segment,
		pad: number,
	) => {
		const keys: string[] = [];
		const midLat = (((ay + by) / 2) * Math.PI) / 180;
		const padX = pad === 0 ? 0 : Math.ceil(pad / Math.cos(midLat));
		for (
			let x = Math.floor(Math.min(ax, bx) / cell) - padX;
			x <= Math.floor(Math.max(ax, bx) / cell) + padX;
			x++
		) {
			for (
				let y = Math.floor(Math.min(ay, by) / cell) - pad;
				y <= Math.floor(Math.max(ay, by) / cell) + pad;
				y++
			) {
				keys.push(`${x},${y}`);
			}
		}
		return keys;
	};

	const grid = new Map<string, Segment[]>();
	for (const segment of segmentsOf(b)) {
		for (const key of cellsOf(segment, 0)) {
			const list = grid.get(key);
			if (list) list.push(segment);
			else grid.set(key, [segment]);
		}
	}

	let best = Number.POSITIVE_INFINITY;
	for (const segment of segmentsOf(a)) {
		for (const key of cellsOf(segment, 1)) {
			for (const other of grid.get(key) ?? []) {
				best = Math.min(best, segmentKm(segment, other));
				if (best === 0) return 0;
			}
		}
	}
	return best <= maxKm ? best : null;
}
