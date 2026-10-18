import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { HubLinks } from "~/features/hubs/hub-links";
import { listHubs } from "~/features/hubs/hubs";
import { useLang } from "~/features/i18n/use-lang";
import {
	type TrailSummary,
	trailRegions,
	trailTypes,
} from "~/features/trails/trail-schema";
import { trailColor, trailTint } from "~/features/trails/trail-style";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { canHover } from "~/shared/can-hover";
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
};

const rowClass = "flex items-center gap-3 text-sm";
const labelClass = "w-24 shrink-0 text-muted";
// The list keeps the system font: Windows draws a native popup more reliably with it.
const selectClass =
	"h-11 w-full cursor-pointer appearance-none rounded-lg border border-field bg-surface md:h-10 ps-3 pe-9 text-sm transition-colors hover:border-muted/50 hover:bg-soft/60 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30 [&_option]:font-[system-ui]";

function SelectBox(props: Omit<React.ComponentProps<"select">, "className">) {
	return (
		<span className="relative flex min-w-0 flex-1">
			<select {...props} className={selectClass} />
			<svg
				aria-hidden="true"
				viewBox="0 0 20 20"
				className="pointer-events-none absolute end-2.5 top-1/2 size-5 -translate-y-1/2 text-muted"
			>
				<path
					d="m6 8 4 4 4-4"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</span>
	);
}

export function TrailPanel({
	trails,
	allTrails,
	filters,
	titleOf,
	onChange,
	onHoverTrail,
	onSelect,
}: Props) {
	const { t } = useTranslation();
	const lang = useLang();
	const format = useTrailFormat();
	const [open, setOpen] = useState(false);

	const regions = trailRegions.filter((region) =>
		allTrails.some((tr) => tr.region === region),
	);
	const countriesOf = (region: Filters["region"]) =>
		new Set(
			allTrails
				.filter((tr) => !region || tr.region === region)
				.flatMap((tr) => tr.countries),
		);
	const countries = [...countriesOf(filters.region)]
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

	return (
		<section
			aria-label={t("filters.list")}
			className="absolute inset-x-0 bottom-0 z-10 flex max-h-[75dvh] flex-col rounded-t-2xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-float md:inset-x-auto md:top-20 md:start-4 md:bottom-4 md:max-h-none md:w-96 md:rounded-2xl md:pb-0"
		>
			<div className="flex items-center gap-2 p-3">
				<label className="relative flex-1">
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
						type="search"
						value={filters.q}
						onChange={(e) => {
							const q = e.target.value;
							onChange((f) => ({ ...f, q }));
							setOpen(true);
						}}
						placeholder={t("filters.searchPlaceholder")}
						enterKeyHint="search"
						className="h-11 w-full rounded-full border border-field bg-surface ps-11 pe-4 text-base shadow-[inset_0_1px_2px_rgb(0_0_0/0.05)] transition-colors placeholder:text-muted hover:border-muted/50 focus:border-brand focus:outline-2 focus:outline-brand/30"
					/>
				</label>
				<button
					type="button"
					aria-expanded={open}
					aria-controls="trail-panel-body"
					onClick={() => setOpen(!open)}
					className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-on-brand md:hidden"
				>
					{t("filters.count", { count: trails.length })}
					<span className="sr-only">, {t("filters.show")}</span>
					{active > 0 && (
						<>
							<span
								aria-hidden="true"
								className="grid size-5 place-items-center rounded-full bg-surface text-xs text-ink"
							>
								{active}
							</span>
							<span className="sr-only">
								{t("filters.active", { count: active })}
							</span>
						</>
					)}
				</button>
			</div>
			<p className="-mt-1 px-4 pb-2 text-xs leading-snug text-muted">
				{t("disclaimer.short")}
			</p>

			<div
				id="trail-panel-body"
				className={`${open ? "flex" : "hidden"} min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 transition-[opacity,translate] duration-200 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none md:flex`}
			>
				<fieldset>
					<legend className="mb-2 text-xs font-medium text-muted">
						{t("filters.types")}
					</legend>
					<div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
						{trailTypes.map((type) => {
							const pressed = filters.types.includes(type);
							return (
								<button
									key={type}
									type="button"
									aria-pressed={pressed}
									onClick={() =>
										onChange((f) => ({
											...f,
											types: f.types.includes(type)
												? f.types.filter((x) => x !== type)
												: [...f.types, type],
										}))
									}
									className={`flex h-11 shrink-0 cursor-pointer md:h-9 items-center gap-2 rounded-full border px-3 text-sm whitespace-nowrap transition-colors ${
										pressed
											? "font-medium"
											: "border-line hover:border-muted/50 hover:bg-soft"
									}`}
									style={
										pressed
											? {
													background: trailTint(type, 15),
													borderColor: trailColor(type),
												}
											: undefined
									}
								>
									<span
										className="inline-block size-2.5 rounded-full"
										style={{ background: trailColor(type) }}
									/>
									{t(`trailType.${type}`)}
								</button>
							);
						})}
					</div>
				</fieldset>

				<div className="mt-3 flex flex-col gap-2">
					<label className={rowClass}>
						<span className={labelClass}>{t("filters.region")}</span>
						<SelectBox
							value={filters.region ?? ""}
							onChange={(e) => {
								const region =
									(e.target.value as NonNullable<Filters["region"]>) || null;
								onChange((f) => ({
									...f,
									region,
									country:
										f.country && countriesOf(region).has(f.country)
											? f.country
											: null,
								}));
							}}
						>
							<option value="">{t("filters.anyRegion")}</option>
							{regions.map((region) => (
								<option key={region} value={region}>
									{t(`region.${region}`)}
								</option>
							))}
						</SelectBox>
					</label>
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

				<div className="mt-4 flex items-center justify-between text-sm">
					<h2 id="trail-count" className="font-semibold">
						{t("filters.count", { count: trails.length })}
					</h2>
					<p role="status" className="sr-only">
						{t("filters.count", { count: trails.length })}
					</p>
					{(active > 0 || filters.q) && (
						<button
							type="button"
							onClick={() => onChange(() => emptyFilters)}
							className="-my-2 rounded-lg px-2 py-2 text-muted underline hover:bg-soft"
						>
							{t("filters.reset")}
						</button>
					)}
				</div>

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
										setOpen(false);
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
			</div>
		</section>
	);
}
