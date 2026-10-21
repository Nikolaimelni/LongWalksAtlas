import type { ReactNode } from "react";
import { contactEmail } from "./site";

export function EmailLink({ children }: { children?: ReactNode }) {
	return (
		<a
			href={`mailto:${contactEmail}`}
			className="font-medium text-brand underline"
		>
			{children}
		</a>
	);
}
