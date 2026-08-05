export function protect(text: string): string {
	return text.replace(/\{\{(\w+)\}\}/g, "<ph>$1</ph>");
}

export function restore(text: string): string {
	return text.replace(/<ph>(\w+)<\/ph>/g, "{{$1}}");
}

export function withSample(text: string, sample: number): string {
	return text.replace("{{count}}", String(sample));
}

export function withoutSample(text: string, sample: number): string | null {
	const digits = String(sample);
	const at = text.search(new RegExp(`(?<!\\d)${digits}(?!\\d)`));
	if (at < 0) return null;
	return `${text.slice(0, at)}{{count}}${text.slice(at + digits.length)}`;
}

export function pluralSample(
	lang: string,
	category: Intl.LDMLPluralRule,
): number | null {
	const rules = new Intl.PluralRules(lang);
	for (const n of [...range(21, 199), ...range(0, 20)]) {
		if (rules.select(n) === category) return n;
	}
	return null;
}

function range(from: number, to: number): number[] {
	return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
