export type Placement = {
	left: number;
	top: number;
	transform: string;
	maxHeight: number;
};

const gap = 16;
const margin = 8;

export function hoverPlacement(
	x: number,
	y: number,
	viewport: { width: number; height: number },
): Placement {
	const toLeft = x > viewport.width / 2;
	const above = y > viewport.height / 2;
	return {
		left: x + (toLeft ? -gap : gap),
		top: y + (above ? -gap : gap),
		transform: `translate(${toLeft ? "-100%" : "0"}, ${above ? "-100%" : "0"})`,
		maxHeight: (above ? y : viewport.height - y) - gap - margin,
	};
}
