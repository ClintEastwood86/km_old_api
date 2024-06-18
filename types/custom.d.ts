declare namespace Express {
	export interface Request {
		user: string;
	}
}

declare module 'http' {
	export interface IncomingHttpHeaders {
		'movie-alias'?: string;
	}
	export interface IncomingMessage {
		user: string;
		alias: string;
	}
}
