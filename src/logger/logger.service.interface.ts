export interface ILoggerService {
	log(msg: string | object): void;
	warn(msg: string | object): void;
	error(msg: string | object): void;
	fatal(msg: string | object): void;
}
