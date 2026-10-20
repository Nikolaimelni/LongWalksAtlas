import "maplibre-gl/dist/maplibre-gl.css";
import { prewarm, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

setWorkerUrl(workerUrl);
prewarm();
