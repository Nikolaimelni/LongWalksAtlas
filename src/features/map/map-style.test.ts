import { describe, expect, it } from "vitest";
import { recolor } from "./map-style";

const style = {
	version: 8,
	layers: [
		{
			id: "background",
			type: "background",
			paint: { "background-color": "#eee" },
		},
		{
			id: "water",
			type: "fill",
			paint: { "fill-color": "#ccc", "fill-opacity": 1 },
		},
		{
			id: "waterway",
			type: "line",
			paint: { "line-color": "#ccc", "line-width": 2 },
		},
		{ id: "place_label", type: "symbol", paint: { "text-color": "#333" } },
	],
};

describe("recolor", () => {
	it("sets the colour property each layer type uses, keeping the rest", () => {
		const out = recolor(style, {
			background: "#f6f1e6",
			water: "#bcd9e6",
			waterway: "#a9cddd",
		});
		expect(out.layers).toEqual([
			{
				id: "background",
				type: "background",
				paint: { "background-color": "#f6f1e6" },
			},
			{
				id: "water",
				type: "fill",
				paint: { "fill-color": "#bcd9e6", "fill-opacity": 1 },
			},
			{
				id: "waterway",
				type: "line",
				paint: { "line-color": "#a9cddd", "line-width": 2 },
			},
			{ id: "place_label", type: "symbol", paint: { "text-color": "#333" } },
		]);
	});

	it("leaves layers it has no colour for, and the input, untouched", () => {
		const out = recolor(style, { place_label: "#f00" });
		expect(out.layers[3]).toBe(style.layers[3]);
		expect(style.layers[0]?.paint["background-color"]).toBe("#eee");
	});
});
