import type { ShouldRevalidateFunctionArgs } from "react-router";

export function revalidateOnPathChange({
	currentUrl,
	nextUrl,
	defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
	return currentUrl.pathname === nextUrl.pathname
		? false
		: defaultShouldRevalidate;
}
