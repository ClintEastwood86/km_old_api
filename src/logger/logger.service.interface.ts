export interface ILoggerService {
	log(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
	fatal(...args: unknown[]): void;
}
