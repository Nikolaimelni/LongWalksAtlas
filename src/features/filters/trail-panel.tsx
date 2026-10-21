import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { HubLinks } from "~/features/hubs/hub-links";
import { listHubs } from "~/features/hubs/hubs";
import { useLang } from "~/features/i18n/use-lang";
import { TrailDot } from "~/features/trails/trail-dot";
import {
	type TrailSummary,
	trailRegions,
	trailTypes,
} from "~/features/trails/trail-schema";
import { trailColor } from "~/features/trails/trail-style";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { canHover } from "~/shared/can-hover";
import { CloseIcon } from "~/shared/close-icon";
import { SiteLinks } from "~/shared/site-footer";
import { SuggestTrail } from "~/shared/suggest-trail";
import { useSwipe } from "~/shared/use-swipe";
import {
	countActive,
	dayBuckets,
	emptyFilters,
	type Filters,
	lengthBuckets,
} from "./filters";

type Props = {
	trails: TrailSummary[];
	allTrails: TrailSummary[];
	filters: Filters;
	titleOf: (trail: TrailSummary) => string;
	onChange: (change: (current: Filters) => Filters) => void;
	onHoverTrail: (slug: string | null) => void;
	onSelect: (slug: string) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const rowClass = "flex items-center gap-3 text-sm";
const labelClass = "w-24 shrink-0 text-muted";
// The list keeps the system font: Windows draws a native popup more reliably with it.
const selectClass =
	"h-11 w-full cursor-pointer appearance-none rounded-full border border-field bg-surface md:h-10 ps-4 pe-10 text-sm transition-colors hover:border-muted/50 hover:bg-soft/60 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30 [&_option]:font-[system-ui]";

function SelectBox(props: Omit<React.ComponentProps<"select">, "className">) {
	return (
		<span className="relative flex min-w-0 flex-1">
			<select {...props} className={selectClass} />
			<Chevron
				up={false}
				strokeWidth={2}
				className="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-muted"
			/>
		</span>
	);
}

type ListToggleProps = {
	shown: boolean;
	up: boolean;
	count: number;
	onToggle: () => void;
	className: string;
};

const fade =
	"transition-[opacity,visibility] duration-200 motion-reduce:transition-none";

function ListToggle({
	shown,
	up,
	count,
	onToggle,
	className,
}: ListToggleProps) {
	const { t } = useTranslation();
	return (
		<button
			type="button"
			aria-expanded={shown}
			aria-controls="trail-panel-body"
			onClick={onToggle}
			className={`h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-brand ps-3.5 pe-2.5 text-sm font-semibold text-on-brand hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
		>
			<span className="grid">
				<span
					className={`col-start-1 row-start-1 flex items-center gap-1.5 tabular-nums ${fade} ${shown ? "invisible opacity-0" : ""}`}
				>
					<FiltersIcon />
					{t("filters.count", { count })}
					<span className="sr-only">, {t("filters.show")}</span>
				</span>
				<span
					className={`col-start-1 row-start-1 flex items-center justify-center ${fade} ${shown ? "" : "invisible opacity-0"}`}
				>
					{t("filters.hide")}
					<span className="sr-only">, {t("filters.count", { count })}</span>
				</span>
			</span>
			<Chevron up={up} className="size-5" />
		</button>
	);
}

function FiltersIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 opacity-80">
			<path
				d="M3 6h7M14 6h3M3 14h3M10 14h7"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<circle
				cx="12"
				cy="6"
				r="2"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<circle
				cx="8"
				cy="14"
				r="2"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</svg>
	);
}

function Chevron({
	up,
	className = "size-4",
	strokeWidth = 2.25,
}: {
	up: boolean;
	className?: string;
	strokeWidth?: number;
}) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 20 20"
			className={`${className} transition-transform motion-reduce:transition-none ${up ? "rotate-180" : ""}`}
		>
			<path
				d="m6 8 4 4 4-4"
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function ChipRow({
	legend,
	children,
}: {
	legend: string;
	children: ReactNode;
}) {
	return (
		// A fieldset defaults to min-width: min-content: without min-w-0 it grows to the
		// width of every chip on a phone and the whole panel scrolls sideways.
		<fieldset className="min-w-0">
			<legend className="mb-2 text-xs font-medium text-muted">{legend}</legend>
			<div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
				{children}
			</div>
		</fieldset>
	);
}

type ChipProps = {
	pressed: boolean;
	color: string;
	dot?: boolean;
	onToggle: () => void;
	children: ReactNode;
};

// A type chip keeps a wash of its colour before it is pressed, so the row reads as the
// map's key; a region chip stays plain until then.
const chipLook = (pressed: boolean, dot = false) =>
	pressed
		? "border-(--chip) bg-[color-mix(in_srgb,var(--chip)_15%,transparent)] font-medium"
		: dot
			? "border-[color-mix(in_srgb,var(--chip)_35%,transparent)] bg-[color-mix(in_srgb,var(--chip)_7%,transparent)] hover:bg-[color-mix(in_srgb,var(--chip)_14%,transparent)]"
			: "border-line hover:border-muted/50 hover:bg-soft";

function Chip({ pressed, color, dot, onToggle, children }: ChipProps) {
	return (
		<button
			type="button"
			aria-pressed={pressed}
			onClick={onToggle}
			className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm whitespace-nowrap transition-colors md:h-9 ${chipLook(pressed, dot)}`}
			style={{ "--chip": color } as React.CSSProperties}
		>
			{dot && <TrailDot color={color} />}
			{children}
		</button>
	);
}

const toggle = <T,>(list: readonly T[], value: T): T[] =>
	list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

export function TrailPanel({
	trails,
	allTrails,
	filters,
	titleOf,
	onChange,
	onHoverTrail,
	onSelect,
	open,
	onOpenChange,
}: Props) {
	const { t } = useTranslation();
	const lang = useLang();
	const format = useTrailFormat();
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [folded, setFolded] = useState(false);
	const searchRef = useRef<HTMLInputElement>(null);

	const regions = trailRegions.filter((region) =>
		allTrails.some((tr) => tr.region === region),
	);
	const countriesOf = (picked: Filters["regions"]) =>
		new Set(
			allTrails
				.filter((tr) => picked.length === 0 || picked.includes(tr.region))
				.flatMap((tr) => tr.countries),
		);
	const countries = [...countriesOf(filters.regions)]
		.map((code) => ({ code, name: format.country(code) }))
		.sort((a, b) => a.name.localeCompare(b.name, lang));
	const kmRange = new Intl.NumberFormat(lang, {
		style: "unit",
		unit: "kilometer",
		maximumFractionDigits: 0,
	});
	const lengthLabel = (key: keyof typeof lengthBuckets) => {
		const [from, to] = lengthBuckets[key];
		if (from === 0) return t("filters.under", { value: format.km(to) });
		if (to === Number.POSITIVE_INFINITY) {
			return t("filters.over", { value: format.km(from) });
		}
		return kmRange.formatRange(from, to);
	};
	const active = countActive(filters);
	const tally = t(
		active > 0 || filters.q.trim() !== "" ? "filters.found" : "filters.total",
		{ count: trails.length },
	);
	const swipe = useSwipe((s) => onOpenChange(s === "tap" ? !open : s === "up"));

	// DOM layout: the folded bar's height, for what sits on top of it.
	const sectionRef = useRef<HTMLElement>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	const height = useRef<number | null>(null);
	useEffect(() => {
		const section = sectionRef.current;
		const body = bodyRef.current;
		const main = section?.closest("main");
		if (!section || !body || !main) return;
		const observer = new ResizeObserver(() => {
			height.current = section.offsetHeight;
			const bar = section.offsetHeight - body.offsetHeight;
			main.style.setProperty("--panel-bar", `${bar}px`);
		});
		observer.observe(section);
		return () => observer.disconnect();
	}, []);

	// DOM layout: the panel eases from its old height to the new one.
	const slide = useRef<Animation | null>(null);
	useLayoutEffect(() => {
		const section = sectionRef.current;
		const body = bodyRef.current;
		const before = height.current;
		if (!section || !body) return;
		const release = () => {
			body.style.removeProperty("display");
			body.style.removeProperty("transition");
		};
		slide.current?.cancel();
		release();
		if (before === null) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const after = section.offsetHeight;
		if (after === before) return;
		const wide = window.matchMedia("(width >= 48rem)").matches;
		const closing = wide ? folded : !open;
		const timing = {
			duration: 280,
			easing: closing
				? "cubic-bezier(0.3, 0, 0.2, 1)"
				: "cubic-bezier(0.2, 0, 0, 1)",
		};
		if (closing) {
			body.style.display = "flex";
			body.style.transition = "none";
		}
		const frames = wide
			? [
					{ height: `${before}px`, overflow: "hidden" },
					{ height: `${after}px`, overflow: "hidden" },
				]
			: closing
				? [
						{ transform: "none" },
						{ transform: `translateY(${before - after}px)` },
					]
				: [
						{ transform: `translateY(${after - before}px)` },
						{ transform: "none" },
					];
		slide.current = section.animate(frames, timing);
		slide.current.onfinish = release;
	}, [open, folded]);

	return (
		<section
			ref={sectionRef}
			data-passes-touch
			aria-label={t("filters.list")}
			className={`absolute inset-x-0 bottom-0 z-10 flex max-h-[75dvh] flex-col rounded-t-2xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-float md:inset-x-auto md:top-20 md:start-(--edge) md:max-h-none md:w-96 md:rounded-2xl md:pb-0 short:top-16 ${folded ? "md:bottom-auto" : "md:bottom-[max(1rem,env(safe-area-inset-bottom))]"}`}
		>
			<div
				aria-hidden="true"
				{...swipe}
				className="grid h-5 shrink-0 cursor-grab touch-none place-items-center md:hidden"
			>
				<span className="h-1 w-10 rounded-full bg-line" />
			</div>
			<div className="flex items-center gap-2 px-3 pb-3 md:pt-3">
				<div className="relative flex-1">
					<label>
						<span className="sr-only">{t("filters.search")}</span>
						<svg
							viewBox="0 0 24 24"
							aria-hidden="true"
							className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-muted"
						>
							<circle
								cx="11"
								cy="11"
								r="6.5"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							/>
							<path
								d="m16 16 4 4"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
						<input
							ref={searchRef}
							type="search"
							value={filters.q}
							onChange={(e) => {
								const q = e.target.value;
								onChange((f) => ({ ...f, q }));
								onOpenChange(true);
								setFolded(false);
								// On a phone the matches belong right under the field, above the keyboard.
								if (!canHover()) setFiltersOpen(false);
							}}
							placeholder={t("filters.searchPlaceholder")}
							enterKeyHint="search"
							className={`h-11 w-full rounded-full border border-field bg-surface ps-11 text-base text-ellipsis shadow-[inset_0_1px_2px_rgb(0_0_0/0.05)] transition-colors placeholder:text-muted hover:border-muted/50 focus:border-brand focus:outline-2 focus:outline-brand/30 [&::-webkit-search-cancel-button]:appearance-none ${filters.q === "" ? "pe-4" : "pe-11"}`}
						/>
					</label>
					{/* Our own cross: Safari and Chrome draw a tiny one that a finger misses, and
					Firefox draws none. */}
					{filters.q !== "" && (
						<button
							type="button"
							onClick={() => {
								onChange((f) => ({ ...f, q: "" }));
								searchRef.current?.focus();
							}}
							aria-label={t("filters.clearSearch")}
							className="absolute end-0 top-0 grid size-11 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
						>
							<CloseIcon className="size-5" />
						</button>
					)}
				</div>
				<ListToggle
					shown={open}
					up={!open}
					count={trails.length}
					onToggle={() => {
						if (!open) setFiltersOpen(true);
						onOpenChange(!open);
					}}
					className="flex md:hidden"
				/>
				<ListToggle
					shown={!folded}
					up={!folded}
					count={trails.length}
					onToggle={() => {
						if (folded) setFiltersOpen(true);
						setFolded(!folded);
					}}
					className="hidden md:flex"
				/>
			</div>
			<p className="-mt-1 px-4 pb-2 text-xs leading-snug text-muted">
				{t("disclaimer.short")} <SiteLinks />
			</p>

			<div
				ref={bodyRef}
				id="trail-panel-body"
				className={`${open ? "flex" : "hidden"} min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 transition-[opacity,translate] duration-200 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none ${folded ? "md:hidden" : "md:flex"}`}
			>
				<div className="flex items-center justify-between gap-2 text-sm">
					<button
						type="button"
						aria-expanded={filtersOpen}
						aria-controls="trail-filters"
						onClick={() => setFiltersOpen(!filtersOpen)}
						className="-ms-2 flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-2 text-base font-semibold hover:bg-soft md:h-9"
					>
						{t("filters.toggle")}
						{active > 0 && (
							<>
								<span
									aria-hidden="true"
									className="grid size-5 place-items-center rounded-full bg-brand text-xs font-semibold text-on-brand"
								>
									{active}
								</span>
								<span className="sr-only">
									, {t("filters.active", { count: active })}
								</span>
							</>
						)}
						<Chevron up={filtersOpen} />
					</button>
					{(active > 0 || filters.q) && (
						<button
							type="button"
							onClick={() => onChange(() => emptyFilters)}
							className="-me-2 h-11 cursor-pointer rounded-full px-3 text-muted underline hover:bg-soft md:h-9"
						>
							{t("filters.reset")}
						</button>
					)}
				</div>

				<div
					id="trail-filters"
					className={`${filtersOpen ? "flex" : "hidden"} mt-3 flex-col gap-3`}
				>
					<ChipRow legend={t("filters.region")}>
						{regions.map((region) => (
							<Chip
								key={region}
								pressed={filters.regions.includes(region)}
								color="var(--color-brand)"
								onToggle={() =>
									onChange((f) => {
										const picked = toggle(f.regions, region);
										return {
											...f,
											regions: picked,
											country:
												f.country && countriesOf(picked).has(f.country)
													? f.country
													: null,
										};
									})
								}
							>
								{t(`region.${region}`)}
							</Chip>
						))}
					</ChipRow>
					<div className="flex flex-col gap-2">
						<label className={rowClass}>
							<span className={labelClass}>{t("filters.country")}</span>
							<SelectBox
								value={filters.country ?? ""}
								onChange={(e) => {
									const country = e.target.value || null;
									onChange((f) => ({ ...f, country }));
								}}
							>
								<option value="">{t("filters.anyCountry")}</option>
								{countries.map((c) => (
									<option key={c.code} value={c.code}>
										{c.name}
									</option>
								))}
							</SelectBox>
						</label>
						<label className={rowClass}>
							<span className={labelClass}>{t("filters.length")}</span>
							<SelectBox
								value={filters.length ?? ""}
								onChange={(e) => {
									const length =
										(e.target.value as keyof typeof lengthBuckets) || null;
									onChange((f) => ({ ...f, length }));
								}}
							>
								<option value="">{t("filters.anyLength")}</option>
								{Object.keys(lengthBuckets).map((key) => (
									<option key={key} value={key}>
										{lengthLabel(key as keyof typeof lengthBuckets)}
									</option>
								))}
							</SelectBox>
						</label>
						<label className={rowClass}>
							<span className={labelClass}>{t("filters.duration")}</span>
							<SelectBox
								value={filters.days ?? ""}
								onChange={(e) => {
									const days =
										(e.target.value as keyof typeof dayBuckets) || null;
									onChange((f) => ({ ...f, days }));
								}}
							>
								<option value="">{t("filters.anyDuration")}</option>
								{(Object.keys(dayBuckets) as (keyof typeof dayBuckets)[]).map(
									(key) => (
										<option key={key} value={key}>
											{t(`filters.${key}`)}
										</option>
									),
								)}
							</SelectBox>
						</label>
					</div>
					<ChipRow legend={t("filters.types")}>
						{trailTypes.map((type) => (
							<Chip
								key={type}
								pressed={filters.types.includes(type)}
								color={trailColor(type)}
								dot
								onToggle={() =>
									onChange((f) => ({ ...f, types: toggle(f.types, type) }))
								}
							>
								{t(`trailType.${type}`)}
							</Chip>
						))}
					</ChipRow>
				</div>

				<h2 id="trail-count" className="mt-4 text-sm font-semibold">
					{tally}
				</h2>
				<p role="status" className="sr-only">
					{tally}
				</p>

				{trails.length === 0 ? (
					<p className="mt-4 text-sm text-muted">{t("filters.none")}</p>
				) : (
					<ul aria-labelledby="trail-count" className="mt-2 flex flex-col">
						{trails.map((trail) => (
							<li key={trail.slug}>
								<Link
									to={`/${lang}/trail/${trail.slug}/`}
									viewTransition
									onClick={(e) => {
										if (canHover()) return;
										e.preventDefault();
										onOpenChange(false);
										onSelect(trail.slug);
									}}
									onMouseEnter={() => onHoverTrail(trail.slug)}
									onMouseLeave={() => onHoverTrail(null)}
									onFocus={() => onHoverTrail(trail.slug)}
									onBlur={() => onHoverTrail(null)}
									className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand"
								>
									<span
										className="mt-1.5 inline-block h-3 w-1 shrink-0 rounded-full"
										style={{ background: trailColor(trail.type) }}
									/>
									<span className="min-w-0">
										<span className="block font-medium">{titleOf(trail)}</span>
										<span className="block truncate text-xs text-muted">
											{format.countries(trail.countries)} ·{" "}
											{format.km(trail.lengthKm)} · {format.daysOf(trail)}
										</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
				<HubLinks
					hubs={listHubs(allTrails)}
					className="mt-4 border-t border-line px-2 pt-3"
				/>
				<p className="mt-4 px-2 text-xs leading-relaxed text-muted">
					{t("app.description")}
				</p>
				<SuggestTrail className="mt-2 px-2 text-xs leading-relaxed text-muted" />
			</div>
		</section>
	);
}
