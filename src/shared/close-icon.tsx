export function CloseIcon({ className }: { className: string }) {
	return (
		<svg aria-hidden="true" viewBox="0 0 20 20" className={className}>
			<path
				d="m5 5 10 10M15 5 5 15"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
