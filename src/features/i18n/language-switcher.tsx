import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { swapLang } from "./languages";
import { publishedLanguages } from "./published";
import { storeLang } from "./stored-lang";
import { useLang } from "./use-lang";

// A popover of links rather than a <select>: each language is a real link a crawler
// can follow, and the list gets the site's own type instead of the OS menu.
export function LanguageSwitcher() {
	const { t } = useTranslation();
	const lang = useLang();
	const location = useLocation();
	const menuId = useId();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const current = publishedLanguages.find((l) => l.code === lang);

	// Runs before the popover opens: the button's own activation toggles it after
	// click handlers, so the menu is already in place when it appears.
	function placeMenu() {
		const button = buttonRef.current?.getBoundingClientRect();
		const menu = menuRef.current;
		if (!button || !menu) return;
		menu.style.top = `${button.bottom + 8}px`;
		const rightHalf = button.left > window.innerWidth / 2;
		menu.style.left = rightHalf ? "auto" : `${button.left}px`;
		menu.style.right = rightHalf
			? `${window.innerWidth - button.right}px`
			: "auto";
	}

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				data-passes-touch
				popoverTarget={menuId}
				onClick={placeMenu}
				aria-label={`${t("language.label")}: ${current?.name ?? lang}`}
				className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-surface/90 ps-3 pe-3.5 text-sm shadow-float backdrop-blur transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 20 20"
					className="size-4.5 text-muted"
				>
					<g fill="none" stroke="currentColor" strokeWidth="1.6">
						<circle cx="10" cy="10" r="7.25" />
						<path d="M2.75 10h14.5M10 2.75c2 2 3 4.4 3 7.25s-1 5.25-3 7.25c-2-2-3-4.4-3-7.25s1-5.25 3-7.25Z" />
					</g>
				</svg>
				<span>{current?.name}</span>
			</button>
			<div
				ref={menuRef}
				id={menuId}
				popover="auto"
				className="fixed m-0 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border-0 bg-surface p-2 text-ink shadow-float [inset:auto]"
			>
				<p className="px-2 pt-1 pb-2 text-xs font-medium text-muted">
					{t("language.choose")}
				</p>
				<ul className="grid grid-cols-2 gap-0.5">
					{publishedLanguages.map((l) => (
						<li key={l.code}>
							<Link
								to={swapLang(location.pathname, l.code) + location.search}
								lang={l.code}
								hrefLang={l.code}
								aria-current={l.code === lang ? "true" : undefined}
								onClick={() => {
									storeLang(l.code);
									menuRef.current?.hidePopover();
								}}
								className="block rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand aria-[current]:bg-soft aria-[current]:font-semibold aria-[current]:text-brand"
							>
								{l.name}
							</Link>
						</li>
					))}
				</ul>
			</div>
		</>
	);
}
