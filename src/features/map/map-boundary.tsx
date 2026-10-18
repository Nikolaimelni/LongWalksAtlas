import { Component, type ReactNode, useState } from "react";

type Props = { fallback: ReactNode; children: ReactNode };
type State = { failed: boolean };

// When the map's code fails to load (an old page after a deploy asks for a bundle that
// is gone) or the device has no WebGL, the text around it stays and the map's box says
// what happened, instead of the whole page turning into an error.
export class MapBoundary extends Component<Props, State> {
	override state: State = { failed: false };

	static getDerivedStateFromError(): State {
		return { failed: true };
	}

	override render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

// react-map-gl reports a map that could not be created at all through onError, with no
// map attached, rather than throwing; this turns that into a throw for MapBoundary.
// Errors from a running map (a tile that did not load) carry the map and are left alone.
export function useMapFailure() {
	const [failure, setFailure] = useState<Error | null>(null);
	if (failure) throw failure;
	return (event: { target: unknown; error: Error }) => {
		if (!event.target) setFailure(event.error);
	};
}
