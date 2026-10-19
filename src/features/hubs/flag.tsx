type Props = { code: string; className?: string };

// Decorative: the country's name always sits next to it. The SVGs come from
// `pnpm flags`, which copies only the countries the atlas has.
export function Flag({ code, className = "" }: Props) {
	return (
		<img
			src={`/flags/${code.toLowerCase()}.svg`}
			alt=""
			width={20}
			height={15}
			loading="lazy"
			className={`inline-block h-[0.75em] w-auto rounded-[2px] ring-1 ring-black/10 ${className}`}
		/>
	);
}
