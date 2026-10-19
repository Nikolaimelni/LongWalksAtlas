type Props = { className?: string };

// Fixed colours instead of currentColor, so the badge looks the same on light and dark
// pages. The sun is the dark-scheme historic colour from trail-style.ts.
const badge = "#155445";
const ridge = "#2a6b5a";
const paper = "#fbf5e6";
const sun = "#cd8b4b";

export function LogoMark({ className }: Props) {
	return (
		<svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
			<rect width="64" height="64" rx="14" fill={badge} />
			<path d="M8 48 26 20l8 11 6-8 16 25Z" fill={ridge} />
			<path
				d="M12 54c8-2 10-8 18-10s9-9 10-17"
				fill="none"
				stroke={paper}
				strokeWidth="3.2"
				strokeLinecap="round"
				strokeDasharray="1 6.5"
			/>
			<circle cx="49" cy="15" r="5" fill={sun} />
		</svg>
	);
}
