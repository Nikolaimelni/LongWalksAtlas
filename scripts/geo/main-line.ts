import type { Position } from "geojson";

type Options = {
	snapKm: number;
	bridgeKm: number;
};

const defaults: Options = { snapKm: 3, bridgeKm: 0.5 };

export function mainLine(
	segments: readonly Position[][],
	from: Position,
	to: Position,
	options: Partial<Options> = {},
): Position[] | null {
	const { snapKm, bridgeKm } = { ...defaults, ...options };
	const graph = buildGraph(segments);
	if (graph.coords.length === 0) return null;
	bridgeDeadEnds(graph, bridgeKm);

	const start = nearest(graph.coords, from, snapKm);
	const end = nearest(graph.coords, to, snapKm);
	if (start === undefined || end === undefined) return null;

	const path = shortestPath(graph, start, end);
	return path?.map((i) => graph.coords[i] ?? [0, 0]) ?? null;
}

type Graph = {
	coords: Position[];
	edges: { to: number; km: number }[][];
};

function buildGraph(segments: readonly Position[][]): Graph {
	const ids = new Map<string, number>();
	const coords: Position[] = [];
	const edges: Graph["edges"] = [];

	const id = (p: Position) => {
		const k = `${p[0]},${p[1]}`;
		let i = ids.get(k);
		if (i === undefined) {
			i = coords.length;
			ids.set(k, i);
			coords.push(p);
			edges.push([]);
		}
		return i;
	};

	for (const segment of segments) {
		for (let n = 1; n < segment.length; n++) {
			const a = segment[n - 1];
			const b = segment[n];
			if (!a || !b) continue;
			link({ coords, edges }, id(a), id(b));
		}
	}
	return { coords, edges };
}

function link(graph: Graph, a: number, b: number) {
	if (a === b) return;
	const pa = graph.coords[a];
	const pb = graph.coords[b];
	if (!pa || !pb) return;
	const km = haversineKm(pa, pb);
	graph.edges[a]?.push({ to: b, km });
	graph.edges[b]?.push({ to: a, km });
}

function bridgeDeadEnds(graph: Graph, bridgeKm: number) {
	const cell = bridgeKm / 111;
	const grid = new Map<string, number[]>();
	const cellOf = (p: Position) =>
		[Math.floor((p[0] ?? 0) / cell), Math.floor((p[1] ?? 0) / cell)] as const;
	graph.coords.forEach((p, i) => {
		const [x, y] = cellOf(p);
		const k = `${x},${y}`;
		grid.set(k, [...(grid.get(k) ?? []), i]);
	});

	const deadEnds = graph.edges.flatMap((e, i) => (e.length === 1 ? [i] : []));
	for (const i of deadEnds) {
		const p = graph.coords[i];
		if (!p) continue;
		const own = new Set(reachableWithin(graph, i, bridgeKm * 4));
		const [x, y] = cellOf(p);
		// Cells are square in degrees, and a degree of longitude shrinks towards the
		// poles: at Kungsleden's 67° N a bridge spans three cells sideways, not one.
		const lat = ((p[1] ?? 0) * Math.PI) / 180;
		const reachX = Math.ceil(1 / Math.max(Math.cos(lat), 0.05));
		let best: { j: number; km: number } | undefined;
		for (let dx = -reachX; dx <= reachX; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				for (const j of grid.get(`${x + dx},${y + dy}`) ?? []) {
					if (own.has(j)) continue;
					const q = graph.coords[j];
					if (!q) continue;
					const km = haversineKm(p, q);
					if (km <= bridgeKm && (!best || km < best.km)) best = { j, km };
				}
			}
		}
		if (best) link(graph, i, best.j);
	}
}

// Dijkstra cut off at `km`: a node first reached by a long way round still counts as
// near when a shorter way to it turns up later.
function reachableWithin(graph: Graph, from: number, km: number): number[] {
	const dist = new Map<number, number>([[from, 0]]);
	const heap = new MinHeap();
	heap.push(from, 0);
	for (let top = heap.pop(); top; top = heap.pop()) {
		const [i, d] = top;
		if (d > (dist.get(i) ?? Infinity)) continue;
		for (const e of graph.edges[i] ?? []) {
			const next = d + e.km;
			if (next <= km && next < (dist.get(e.to) ?? Infinity)) {
				dist.set(e.to, next);
				heap.push(e.to, next);
			}
		}
	}
	return [...dist.keys()];
}

function nearest(
	coords: Position[],
	p: Position,
	maxKm: number,
): number | undefined {
	let best: { i: number; km: number } | undefined;
	coords.forEach((q, i) => {
		const km = haversineKm(p, q);
		if (km <= maxKm && (!best || km < best.km)) best = { i, km };
	});
	return best?.i;
}

function shortestPath(
	graph: Graph,
	start: number,
	end: number,
): number[] | null {
	const dist = new Float64Array(graph.coords.length).fill(Infinity);
	const prev = new Int32Array(graph.coords.length).fill(-1);
	const heap = new MinHeap();
	dist[start] = 0;
	heap.push(start, 0);

	for (;;) {
		const top = heap.pop();
		if (!top) return null;
		const [i, d] = top;
		if (i === end) break;
		if (d > (dist[i] ?? Infinity)) continue;
		for (const e of graph.edges[i] ?? []) {
			const next = d + e.km;
			if (next < (dist[e.to] ?? Infinity)) {
				dist[e.to] = next;
				prev[e.to] = i;
				heap.push(e.to, next);
			}
		}
	}

	const path = [end];
	for (let i = end; i !== start; ) {
		i = prev[i] ?? -1;
		if (i < 0) return null;
		path.push(i);
	}
	return path.reverse();
}

class MinHeap {
	private items: [node: number, priority: number][] = [];

	push(node: number, priority: number) {
		const items = this.items;
		items.push([node, priority]);
		let i = items.length - 1;
		while (i > 0) {
			const parent = (i - 1) >> 1;
			const p = items[parent];
			const c = items[i];
			if (!p || !c || p[1] <= c[1]) break;
			items[parent] = c;
			items[i] = p;
			i = parent;
		}
	}

	pop(): [number, number] | undefined {
		const items = this.items;
		const top = items[0];
		const last = items.pop();
		if (!top || !last || items.length === 0) return top;
		items[0] = last;
		let i = 0;
		for (;;) {
			const l = 2 * i + 1;
			const r = l + 1;
			let smallest = i;
			if ((items[l]?.[1] ?? Infinity) < (items[smallest]?.[1] ?? Infinity))
				smallest = l;
			if ((items[r]?.[1] ?? Infinity) < (items[smallest]?.[1] ?? Infinity))
				smallest = r;
			if (smallest === i) return top;
			const a = items[i];
			const b = items[smallest];
			if (!a || !b) return top;
			items[i] = b;
			items[smallest] = a;
			i = smallest;
		}
	}
}

const earthKm = 6371.0088;

export function haversineKm(a: Position, b: Position): number {
	const rad = Math.PI / 180;
	const [lng1 = 0, lat1 = 0] = a;
	const [lng2 = 0, lat2 = 0] = b;
	const dLat = (lat2 - lat1) * rad;
	const dLng = (lng2 - lng1) * rad;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
	return 2 * earthKm * Math.asin(Math.sqrt(h));
}
