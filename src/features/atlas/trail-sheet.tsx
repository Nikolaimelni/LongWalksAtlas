import { type ReactNode, useEffect, useRef } from "react";

type Props = {
	label: string;
	onClose: () => void;
	children: ReactNode;
};

export function TrailSheet({ label, onClose, children }: Props) {
	const ref = useRef<HTMLElement>(null);

	// DOM focus: into the sheet on open, so a keyboard or screen reader lands on it, and
	// back where it was on close.
	useEffect(() => {
		const before =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		ref.current?.focus({ preventScroll: true });
		return () => before?.focus({ preventScroll: true });
	}, []);

	return (
		<section
			ref={ref}
			tabIndex={-1}
			aria-label={label}
			onKeyDown={(event) => {
				if (event.key === "Escape") onClose();
			}}
			className="absolute inset-x-0 bottom-0 z-20 max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-float outline-none transition-[translate,opacity] duration-300 ease-out starting:translate-y-full motion-reduce:transition-none md:inset-x-auto md:start-[26rem] md:bottom-4 md:max-h-[calc(100dvh-6rem)] md:w-96 md:rounded-2xl md:starting:translate-y-4 md:starting:opacity-0"
		>
			{children}
		</section>
	);
}
