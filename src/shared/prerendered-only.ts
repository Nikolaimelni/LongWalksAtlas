import { data } from "react-router";

// A page that was not prerendered has no .data file, and the host answers with an HTML
// page that the router cannot decode, so anything that fails here is a missing page.
// Except a failed fetch: that is a lost connection, and "Page not found" would lie.
export async function prerenderedOnly<T>(
	serverLoader: () => Promise<T>,
): Promise<T> {
	try {
		return await serverLoader();
	} catch (error) {
		if (error instanceof TypeError) throw error;
		throw data("Not found", { status: 404 });
	}
}
