export type DataErrorCode =
	| "invalid-env"
	| "invalid-trail"
	| "invalid-content"
	| "overpass-failed"
	| "overpass-bad-response"
	| "osm-api-failed"
	| "empty-geometry"
	| "incomplete-build";

export class DataError extends Error {
	readonly code: DataErrorCode;

	constructor(code: DataErrorCode, message: string) {
		super(message);
		this.name = "DataError";
		this.code = code;
	}
}
