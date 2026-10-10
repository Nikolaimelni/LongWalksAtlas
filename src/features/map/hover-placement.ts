export type Placement = {
	left: number;
	top: number;
	maxHeight: number;
};

type Size = { width: number; height: number };

const gap = 16;
const margin = 8;

// The card sits beside the pointer, never over it, and slides up or down to stay on
// screen.
export function hoverPlacement(
	x: number,
	y: number,
	card: Size,
	viewport: Size,
): Placement {
	const maxHeight = viewport.height - 2 * margin;
	const height = Math.min(card.height, maxHeight);
	const fitsRight = x + gap + card.width <= viewport.width - margin;
	const left = fitsRight ? x + gap : Math.max(margin, x - gap - card.width);
	const top = Math.min(
		Math.max(margin, y - height / 2),
		viewport.height - margin - height,
	);
	return { left, top, maxHeight };
}
