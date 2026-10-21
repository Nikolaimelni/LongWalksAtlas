export function TrailDot({ color }: { color: string }) {
	return (
		<span
			className="inline-block size-2.5 shrink-0 rounded-full"
			style={{ background: color }}
		/>
	);
}
