export class HTTPError extends Error {
	constructor(public code: number, public context: string, msg: string, public data: Record<string, any> & { error: string }) {
		super(msg);
	}
}
