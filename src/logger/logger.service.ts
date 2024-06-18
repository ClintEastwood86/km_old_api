import { ILoggerService } from './logger.service.interface';
import { injectable } from 'inversify';
import 'reflect-metadata';
import { Logger } from 'tslog';

@injectable()
export class LoggerService implements ILoggerService {
	private logger: Logger;

	constructor() {
		this.logger = new Logger({
			dateTimeTimezone: 'Europe/Moscow',
			dateTimePattern: 'day-month hour:minute:second',
			displayFilePath: 'hidden',
			displayFunctionName: false
		});
	}

	log(...args: unknown[]): void {
		this.logger.info(...args);
	}
	warn(...args: string[]): void {
		this.logger.warn(...args);
	}
	error(...args: unknown[]): void {
		this.logger.error(...args);
	}
	fatal(...args: unknown[]): void {
		this.logger.fatal(...args);
		process.exit();
	}
}
