import { describe, expect, it } from "vitest";
import { redirectScript } from "./redirect-script";

function run(languages: string[], stored: string | null = null): string {
	let target = "";
	const env = {
		navigator: { languages, language: languages[0] },
		localStorage: { getItem: () => stored },
		location: {
			search: "",
			hash: "",
			replace: (url: string) => {
				target = url;
			},
		},
	};
	new Function(
		"navigator",
		"localStorage",
		"location",
		redirectScript(["en", "ru", "pt-PT", "uk"]),
	)(env.navigator, env.localStorage, env.location);
	return target;
}

describe("redirectScript", () => {
	it("follows the browser's first language we publish", () => {
		expect(run(["cs-CZ", "uk-UA", "en"])).toBe("/uk/");
		expect(run(["pt-BR"])).toBe("/pt-PT/");
	});

	it("prefers a language picked earlier in the switcher", () => {
		expect(run(["en-US"], "ru")).toBe("/ru/");
	});

	it("ignores a stored language that is not published", () => {
		expect(run(["ru-RU"], "ja")).toBe("/ru/");
	});

	it("falls back to English", () => {
		expect(run(["ko-KR"])).toBe("/en/");
	});
});
