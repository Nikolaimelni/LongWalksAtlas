type Props = { className?: string };
type Point = { x: number; y: number };

// Fixed colours instead of currentColor, so the badge looks the same on light and dark
// pages. The lines borrow the dark-scheme trail colours from trail-style.ts.
const badge = "#155445";
const paper = "#fbf5e6";

function Pin({ x, y, color }: Point & { color: string }) {
	return (
		<g transform={`translate(${x} ${y})`}>
			<path
				d="M0 6.6c-1.4-2-3.6-4.2-3.6-6.6a3.6 3.6 0 0 1 7.2 0c0 2.4-2.2 4.6-3.6 6.6Z"
				fill={color}
			/>
			<circle r="1.4" fill={badge} />
		</g>
	);
}

function Tree({ x, y }: Point) {
	return (
		<g transform={`translate(${x} ${y})`} fill={paper}>
			<path d="m0 0 2.6 3.6h-1.3l2 2.8h-6.6l2-2.8h-1.3Z" />
			<rect x="-0.5" y="6" width="1" height="1.8" />
		</g>
	);
}

export function LogoMark({ className }: Props) {
	return (
		<svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
			<rect width="64" height="64" rx="14" fill={badge} />
			<path d="m24.6 30.5 5-6.8 1.9 2 4.3-6.9 5.4 11.7Z" fill={paper} />
			<g fill="none" strokeLinecap="round" strokeLinejoin="round">
				<path
					d="m33.8 22.3 1 1.1 1-1.3 1.1 1.2"
					stroke={badge}
					strokeWidth="1"
				/>
				<path
					d="M8 18 23 13l18 5 15-5v36l-15 5-18-5-15 5ZM23 13v36M41 18v36"
					stroke={paper}
					strokeWidth="2.6"
				/>
				<path
					d="M15.5 32.5c-2.4 2.4-1.6 4.4.6 6.2s2.8 5.6 7.4 6.6 5-.4 7.4-.2"
					stroke="#f2b441"
					strokeWidth="2.4"
				/>
				<path
					d="M33.5 45c4 .5 6-3.6 8.5-7s4.5-6.5 6.5-7.5"
					stroke="#86cf74"
					strokeWidth="2.4"
				/>
				<path
					d="M54 29c-2.8 2.6.6 5.4-1.8 8.4s-4.6 4.4-3.4 9.6"
					stroke="#62aef2"
					strokeWidth="2.4"
				/>
			</g>
			<Tree x={12.2} y={41} />
			<Tree x={45.5} y={37.4} />
			<Pin x={15.5} y={24.2} color="#ef6a4f" />
			<Pin x={32} y={38.2} color="#86cf74" />
			<Pin x={48.5} y={22.7} color="#62aef2" />
		</svg>
	);
}
