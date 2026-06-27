import { describe, expect, it } from "vitest";
import { serializeJsonLd, trailJsonLd } from "./trail-json-ld";
import type { TrailFile, TrailSummary } from "./trail-schema";

const file: TrailFile = {
	slug: "lycian-way",
	name: { original: "Likya Yolu" },
	type: "coastal",
	region: "europe",
	start: { name: "Ölüdeniz", coords: [29.1155, 36.549] },
	end: { name: "Geyikbayırı", coords: [30.4625, 36.8795] },
	countries: ["TR"],
	lengthKm: 760,
	days: { min: 35, max: 35 },
	bestSeason: ["apr"],
	badges: [],
	officialUrl: "https://cultureroutesinturkey.com/the-lycian-way/",
	sources: ["https://cultureroutesinturkey.com/the-lycian-way/"],
	photo: null,
	geometry: { source: "osm", relationIds: [51855] },
	verifiedAt: "2026-10-18",
};

const summary: TrailSummary = {
	slug: file.slug,
	name: file.name,
	type: file.type,
	region: file.region,
	start: file.start,
	end: file.end,
	countries: file.countries,
	bestSeason: file.bestSeason,
	badges: file.badges,
	lengthKm: 760,
	lengthSource: "official",
	days: { min: 35, max: 35 },
	bbox: [29.1, 36.2, 30.5, 36.9],
};

const ld = trailJsonLd({
	summary,
	file,
	content: {
		title: "Lycian Way",
		summary: "A coastal path.",
		status: "machine",
		lang: "en",
	},
	url: "https://longwalksatlas.com/en/trail/lycian-way/",
	atlas: { name: "Long Walks Atlas", url: "https://longwalksatlas.com/en/" },
	countryNames: ["Türkiye"],
	faq: [{ question: "How long is it?", answer: "760 km." }],
}) as { "@graph": Record<string, unknown>[] };

describe("trailJsonLd", () => {
	it("describes the trail with its original name and official site", () => {
		const trail = ld["@graph"][0];
		expect(trail).toMatchObject({
			"@type": "TouristAttraction",
			name: "Lycian Way",
			alternateName: "Likya Yolu",
			sameAs: ["https://cultureroutesinturkey.com/the-lycian-way/"],
			geo: { latitude: 36.549, longitude: 29.1155 },
		});
	});

	it("puts the atlas above the trail in the breadcrumb", () => {
		expect(ld["@graph"][1]).toMatchObject({
			itemListElement: [{ position: 1 }, { position: 2, name: "Lycian Way" }],
		});
	});
});

describe("serializeJsonLd", () => {
	it("cannot be used to close the script tag", () => {
		const out = serializeJsonLd({ text: "</script><script>alert(1)</script>" });
		expect(out).not.toContain("</script>");
		expect(JSON.parse(out)).toEqual({
			text: "</script><script>alert(1)</script>",
		});
	});
});
