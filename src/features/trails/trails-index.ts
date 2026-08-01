import photoIndex from "~/generated/photos.json";
import index from "~/generated/trails-index.json";
import type { TrailPhoto, TrailSummary } from "./trail-schema";

// why: both files are written by the data scripts from Zod-validated input, but JSON
// imports widen literal unions and tuples (coords become number[]), so the precise types
// are restated here, once, instead of at every import.
export const trailsIndex = index as unknown as TrailSummary[];
export const photos = photoIndex as unknown as Record<string, TrailPhoto>;
