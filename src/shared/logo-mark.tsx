type Props = { className?: string };

export function LogoMark({ className }: Props) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
			<circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.14" />
			<path
				d="M5 17.5c2.6-.6 3.2-4.6 6-5.4s3.6 1.8 6.6-4.2"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeDasharray="0.1 3.4"
			/>
			<circle cx="17.8" cy="7.2" r="2.2" fill="currentColor" />
		</svg>
	);
}
