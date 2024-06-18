import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { ILoggerService } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { IExeptionFilter } from './exeption.filter.interface';
import { HTTPError } from './http-error';
import 'reflect-metadata';

@injectable()
export class ExeptionFilter implements IExeptionFilter {
	constructor(@inject(TYPES.ILoggerService) private logger: ILoggerService) {}

	catch(error: Error | HTTPError, req: Request, res: Response, next: NextFunction): void {
		if (error instanceof HTTPError) {
			res.status(error.code).json({
				code: error.code,
				message: error.message,
				context: error.context,
				data: {
					...error.data
				}
			});

			this.logger.error(`[${error.context}] Ошибка: ${error.code} ${error.message}`);
		} else {
			res.status(500).json({
				code: 500,
				message: error.message
			});

			this.logger.error(`[ExeptionFilter] Ошибка: 500 ${error.message}`);
		}
	}
}
