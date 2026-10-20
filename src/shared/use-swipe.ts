import { useRef } from "react";

export type Swipe = "up" | "down" | "tap";

// A finger travels a few pixels on any tap, so a swipe has to go further than that.
const minSwipe = 32;

// Pointer handlers for a sheet's grab handle. Only the handle listens, so the list
// under it keeps scrolling the usual way; give the handle touch-action: none so the
// browser does not scroll the page or pull to refresh instead.
export function useSwipe(onSwipe: (swipe: Swipe) => void) {
	const startY = useRef<number | null>(null);
	const swiped = useRef(false);
	return {
		onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
			startY.current = event.clientY;
			swiped.current = false;
			event.currentTarget.setPointerCapture(event.pointerId);
		},
		onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
			if (startY.current === null) return;
			const dy = event.clientY - startY.current;
			startY.current = null;
			if (Math.abs(dy) < minSwipe) return;
			swiped.current = true;
			onSwipe(dy > 0 ? "down" : "up");
		},
		onPointerCancel: () => {
			startY.current = null;
		},
		onClick: () => {
			if (!swiped.current) onSwipe("tap");
		},
	};
}
