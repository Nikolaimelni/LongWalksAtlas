import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "~/shared/close-icon";
import { useSwipe } from "~/shared/use-swipe";

function swallowNextClick() {
	const swallow = (event: MouseEvent) => {
		event.stopPropagation();
		event.preventDefault();
	};
	window.addEventListener("click", swallow, { capture: true, once: true });
	setTimeout(
		() => window.removeEventListener("click", swallow, { capture: true }),
		600,
	);
}

type Props = {
	label: string;
	onClose: () => void;
	children: ReactNode;
};

export function TrailSheet({ label, onClose, children }: Props) {
	const { t } = useTranslation();
	const ref = useRef<HTMLElement>(null);
	const [leaving, setLeaving] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const leave = () => {
		if (leaving) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			onClose();
			return;
		}
		setLeaving(true);
		timer.current = setTimeout(onClose, 200);
	};
	useEffect(() => () => clearTimeout(timer.current), []);
	const swipe = useSwipe((s) => {
		if (s === "down") leave();
	});

	// DOM focus: into the sheet on open, so a keyboard or screen reader lands on it, and
	// back where it was on close.
	useEffect(() => {
		const node = ref.current;
		const before =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		node?.focus({ preventScroll: true });
		return () => {
			const now = document.activeElement;
			if (now === document.body || node?.contains(now)) {
				before?.focus({ preventScroll: true });
			}
		};
	}, []);

	// DOM events: on a phone a touch outside the sheet closes it.
	useEffect(() => {
		const node = ref.current;
		const onDown = (event: PointerEvent) => {
			if (!(event.target instanceof Element) || node?.contains(event.target)) {
				return;
			}
			if (window.matchMedia("(width >= 48rem)").matches) return;
			leave();
			if (event.target.closest("[data-passes-touch]")) return;
			event.stopPropagation();
			swallowNextClick();
		};
		document.addEventListener("pointerdown", onDown, true);
		return () => document.removeEventListener("pointerdown", onDown, true);
	});

	return (
		<section
			ref={ref}
			tabIndex={-1}
			aria-label={label}
			onKeyDown={(event) => {
				if (event.key === "Escape") leave();
			}}
			className={`absolute inset-x-2 bottom-[calc(var(--panel-bar,0px)_+_0.5rem)] z-20 max-h-[55dvh] overflow-y-auto rounded-2xl bg-surface px-4 pb-4 shadow-float outline-none transition-[translate,opacity] ease-out starting:translate-y-full motion-reduce:transition-none md:inset-x-auto md:start-[calc(var(--edge)+25rem)] md:bottom-[max(1rem,env(safe-area-inset-bottom))] md:max-h-[calc(100dvh-6rem)] md:w-96 md:pt-4 md:starting:translate-y-4 md:starting:opacity-0 short:start-(--edge) short:top-16 short:max-h-none ${leaving ? "pointer-events-none translate-y-8 opacity-0 duration-200" : "duration-300"}`}
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
				onClick={leave}
				aria-label={t("trail.close")}
				className="absolute end-6 top-8 z-10 grid size-11 cursor-pointer place-items-center rounded-full bg-surface/90 text-ink shadow-float backdrop-blur transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand md:top-6"
			>
				<CloseIcon className="size-6" />
			</button>
			{children}
		</section>
	);
}
