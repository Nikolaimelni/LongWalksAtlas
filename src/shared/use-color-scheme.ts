import { useSyncExternalStore } from "react";
import type { Scheme } from "~/features/trails/trail-style";

const query = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
	const media = window.matchMedia(query);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
}

export function useColorScheme(): Scheme {
	return useSyncExternalStore(
		subscribe,
		() => (window.matchMedia(query).matches ? "dark" : "light"),
		() => "light",
	);
}
