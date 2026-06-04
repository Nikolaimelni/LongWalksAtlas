export type DataErrorCode =
	| "invalid-env"
	| "invalid-trail"
	| "overpass-failed"
	| "overpass-bad-response"
	| "empty-geometry";

export class DataError extends Error {
	readonly code: DataErrorCode;

	constructor(code: DataErrorCode, message: string) {
		super(message);
		this.name = "DataError";
		this.code = code;
	}
}
