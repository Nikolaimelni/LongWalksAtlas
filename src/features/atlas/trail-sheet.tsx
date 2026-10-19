import { type ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSwipe } from "~/shared/use-swipe";

type Props = {
	label: string;
	onClose: () => void;
	children: ReactNode;
};

export function TrailSheet({ label, onClose, children }: Props) {
	const { t } = useTranslation();
	const ref = useRef<HTMLElement>(null);
	const swipe = useSwipe((s) => {
		if (s === "down") onClose();
	});

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
			className="absolute inset-x-0 bottom-0 z-20 max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-float outline-none transition-[translate,opacity] duration-300 ease-out starting:translate-y-full motion-reduce:transition-none md:inset-x-auto md:start-[26rem] md:bottom-4 md:max-h-[calc(100dvh-6rem)] md:w-96 md:rounded-2xl md:pt-4 md:starting:translate-y-4 md:starting:opacity-0"
		>
			<div
				aria-hidden="true"
				{...swipe}
				className="sticky top-0 z-10 -mx-4 grid h-6 cursor-grab touch-none place-items-center bg-surface md:hidden"
			>
				<span className="h-1 w-10 rounded-full bg-line" />
			</div>
			<button
				type="button"
				onClick={onClose}
				aria-label={t("trail.close")}
				className="absolute end-6 top-8 z-10 grid size-11 cursor-pointer place-items-center rounded-full bg-surface/90 text-xl shadow-float backdrop-blur focus-visible:outline-2 focus-visible:outline-brand md:top-6"
			>
				<span aria-hidden="true">×</span>
			</button>
			{children}
		</section>
	);
}
