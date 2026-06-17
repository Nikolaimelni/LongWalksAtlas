import { data } from "react-router";

export async function prerenderedOnly<T>(
	serverLoader: () => Promise<T>,
): Promise<T> {
	try {
		return await serverLoader();
	} catch {
		throw data("Not found", { status: 404 });
	}
}
