import { ILoggerService } from './logger.service.interface';
import { injectable } from 'inversify';
import 'reflect-metadata';
import { Logger } from 'tslog';
import { logger } from './logger';

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

	log(msg: string | object): void {
		logger.info(msg);
	}
	warn(msg: string | object): void {
		logger.warn(msg);
	}
	error(msg: string | object): void {
		logger.error(msg);
	}
	fatal(msg: string | object): void {
		logger.fatal(msg);
		process.exit();
	}
}
