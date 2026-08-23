import { useColorScheme } from "~/shared/use-color-scheme";
import { type TrailPalette, trailPalettes } from "./trail-style";

export function useTrailColors(): TrailPalette {
	return trailPalettes[useColorScheme()];
}
