import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useLang } from "~/features/i18n/use-lang";
import { type TrailSummary, trailTypes } from "~/features/trails/trail-schema";
import { trailColors } from "~/features/trails/trail-style";
import { useTrailFormat } from "~/features/trails/use-trail-format";
import { canHover } from "~/shared/can-hover";
import {
	countActive,
	dayBuckets,
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

const selectClass =
	"h-10 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm dark:border-stone-700 dark:bg-stone-900";

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

	const regions = new Intl.DisplayNames([lang], { type: "region" });
	const countries = [...new Set(allTrails.flatMap((tr) => tr.countries))]
		.map((code) => ({ code, name: regions.of(code) ?? code }))
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
			className="absolute inset-x-0 bottom-0 z-10 flex max-h-[75dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl md:inset-x-auto md:top-20 md:start-4 md:bottom-4 md:max-h-none md:w-96 md:rounded-2xl md:pb-0 dark:bg-stone-900"
		>
			<div className="flex items-center gap-2 p-3">
				<label className="flex-1">
					<span className="sr-only">{t("filters.search")}</span>
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
						className="h-11 w-full rounded-full bg-stone-100 ps-4 pe-4 text-base dark:bg-stone-800"
					/>
				</label>
				<button
					type="button"
					aria-expanded={open}
					aria-controls="trail-panel-body"
					onClick={() => setOpen(!open)}
					className="h-11 shrink-0 rounded-full bg-stone-900 px-4 text-sm font-semibold text-white md:hidden dark:bg-stone-100 dark:text-stone-900"
				>
					{t("filters.count", { count: trails.length })}
					{active > 0 && ` · ${active}`}
				</button>
			</div>

			<div
				id="trail-panel-body"
				className={`${open ? "flex" : "hidden"} min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 transition-[opacity,translate] duration-200 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none md:flex`}
			>
				<fieldset>
					<legend className="mb-2 text-xs font-medium text-stone-500">
						{t("filters.types")}
					</legend>
					<div className="flex flex-wrap gap-2">
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
									className={`flex h-9 items-center gap-2 rounded-full border px-3 text-sm ${
										pressed
											? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
											: "border-stone-300 dark:border-stone-700"
									}`}
								>
									<span
										className="inline-block size-2.5 rounded-full"
										style={{ background: trailColors[type] }}
									/>
									{t(`trailType.${type}`)}
								</button>
							);
						})}
					</div>
				</fieldset>

				<div className="mt-3 grid grid-cols-3 gap-2">
					<label className="text-xs font-medium text-stone-500">
						{t("filters.country")}
						<select
							value={filters.country ?? ""}
							onChange={(e) => {
								const country = e.target.value || null;
								onChange((f) => ({ ...f, country }));
							}}
							className={`mt-1 ${selectClass}`}
						>
							<option value="">{t("filters.anyCountry")}</option>
							{countries.map((c) => (
								<option key={c.code} value={c.code}>
									{c.name}
								</option>
							))}
						</select>
					</label>
					<label className="text-xs font-medium text-stone-500">
						{t("filters.length")}
						<select
							value={filters.length ?? ""}
							onChange={(e) => {
								const length =
									(e.target.value as keyof typeof lengthBuckets) || null;
								onChange((f) => ({ ...f, length }));
							}}
							className={`mt-1 ${selectClass}`}
						>
							<option value="">{t("filters.anyLength")}</option>
							{Object.keys(lengthBuckets).map((key) => (
								<option key={key} value={key}>
									{lengthLabel(key as keyof typeof lengthBuckets)}
								</option>
							))}
						</select>
					</label>
					<label className="text-xs font-medium text-stone-500">
						{t("filters.duration")}
						<select
							value={filters.days ?? ""}
							onChange={(e) => {
								const days =
									(e.target.value as keyof typeof dayBuckets) || null;
								onChange((f) => ({ ...f, days }));
							}}
							className={`mt-1 ${selectClass}`}
						>
							<option value="">{t("filters.anyDuration")}</option>
							{(Object.keys(dayBuckets) as (keyof typeof dayBuckets)[]).map(
								(key) => (
									<option key={key} value={key}>
										{t(`filters.${key}`)}
									</option>
								),
							)}
						</select>
					</label>
				</div>

				<div className="mt-4 flex items-center justify-between text-sm">
					<h2 className="font-semibold">
						{t("filters.count", { count: trails.length })}
					</h2>
					{(active > 0 || filters.q) && (
						<button
							type="button"
							onClick={() =>
								onChange(() => ({
									q: "",
									types: [],
									country: null,
									length: null,
									days: null,
								}))
							}
							className="text-stone-600 underline dark:text-stone-400"
						>
							{t("filters.reset")}
						</button>
					)}
				</div>

				{trails.length === 0 ? (
					<p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
						{t("filters.none")}
					</p>
				) : (
					<ul className="mt-2 flex flex-col">
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
									className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-stone-900 dark:hover:bg-stone-800"
								>
									<span
										className="mt-1.5 inline-block h-3 w-1 shrink-0 rounded-full"
										style={{ background: trailColors[trail.type] }}
									/>
									<span className="min-w-0">
										<span className="block font-medium">{titleOf(trail)}</span>
										<span className="block truncate text-xs text-stone-500">
											{format.countries(trail.countries)} ·{" "}
											{format.km(trail.lengthKm)} · {format.days(trail.days)}
										</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
