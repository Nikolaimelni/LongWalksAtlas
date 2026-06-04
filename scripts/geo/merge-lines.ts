import type { Position } from "geojson";

type Line = Position[];

const key = (p: Position) => `${p[0]},${p[1]}`;

export function mergeLines(segments: readonly Line[]): Line[] {
	const lines = segments.filter((s) => s.length >= 2);
	const byEnd = new Map<string, number[]>();
	lines.forEach((line, i) => {
		for (const end of [line[0], line.at(-1)]) {
			if (!end) continue;
			const k = key(end);
			byEnd.set(k, [...(byEnd.get(k) ?? []), i]);
		}
	});

	const used = new Set<number>();

	function extend(line: Line): Line {
		for (;;) {
			const tail = line.at(-1);
			if (!tail) return line;
			const next = byEnd.get(key(tail))?.find((i) => !used.has(i));
			if (next === undefined) return line;
			used.add(next);
			const segment = lines[next] ?? [];
			const oriented =
				segment[0] && key(segment[0]) === key(tail)
					? segment
					: [...segment].reverse();
			line.push(...oriented.slice(1));
		}
	}

	const merged: Line[] = [];
	lines.forEach((line, i) => {
		if (used.has(i)) return;
		used.add(i);
		const forward = extend([...line]);
		merged.push(extend(forward.reverse()).reverse());
	});
	return merged;
}
