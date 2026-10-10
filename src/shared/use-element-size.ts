import { useState } from "react";

// ResizeObserver reports after layout and before paint, so a position computed from
// the size lands in the same frame, and it fires again when a photo loads and the
// element grows.
export function useElementSize<T extends HTMLElement>() {
	const [size, setSize] = useState({ width: 0, height: 0 });
	const ref = (node: T | null) => {
		if (!node) return;
		const observer = new ResizeObserver(() =>
			setSize({ width: node.offsetWidth, height: node.offsetHeight }),
		);
		observer.observe(node);
		return () => observer.disconnect();
	};
	return [ref, size] as const;
}
