import { describe, expect, it } from "vitest";
import { hoverPlacement } from "./hover-placement";

const screen = { width: 1280, height: 800 };
const card = { width: 256, height: 420 };

describe("hoverPlacement", () => {
	it("opens to the right, centred on the pointer, when there is room", () => {
		expect(hoverPlacement(400, 400, card, screen)).toEqual({
			left: 416,
			top: 190,
			maxHeight: 784,
		});
	});

	it("flips to the left near the right edge", () => {
		expect(hoverPlacement(1200, 400, card, screen).left).toBe(928);
	});

	it("slides up instead of running off the bottom", () => {
		const { top } = hoverPlacement(660, 640, card, screen);
		expect(top + card.height).toBe(792);
	});

	it("slides down instead of running off the top", () => {
		expect(hoverPlacement(660, 30, card, screen).top).toBe(8);
	});

	it("caps a card taller than the window and pins it to the top", () => {
		const short = { width: 1280, height: 400 };
		expect(hoverPlacement(660, 300, card, short)).toMatchObject({
			top: 8,
			maxHeight: 384,
		});
	});
});
