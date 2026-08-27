import { describe, expect, it } from "vitest";
import { hoverPlacement } from "./hover-placement";

const screen = { width: 1280, height: 800 };

describe("hoverPlacement", () => {
	it("opens down and to the right near the top-left corner", () => {
		expect(hoverPlacement(100, 100, screen)).toEqual({
			left: 116,
			top: 116,
			transform: "translate(0, 0)",
			maxHeight: 676,
		});
	});

	it("opens up and to the left near the bottom-right corner", () => {
		expect(hoverPlacement(1250, 780, screen)).toEqual({
			left: 1234,
			top: 764,
			transform: "translate(-100%, -100%)",
			maxHeight: 756,
		});
	});

	it("caps the height by the room left in a short window", () => {
		const short = { width: 1280, height: 600 };
		expect(hoverPlacement(640, 290, short).maxHeight).toBe(286);
	});
});
