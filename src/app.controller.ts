import { inject, injectable } from 'inversify';
import { BaseController } from './common/base.controller';
import { ILoggerService } from './logger/logger.service.interface';
import { TYPES } from './types';
import { Request, Response } from 'express';
import { HttpStatus } from './helpers/http-status';
import { CommonDatabase } from './database/common.database';
import { MoviesDatabase } from './database/movies.database';

@injectable()
export class AppController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) logger: ILoggerService,
		@inject(TYPES.CommonDatabase) private commonDatabase: CommonDatabase,
		@inject(TYPES.MoviesDatabase) private moviesDatabase: MoviesDatabase
	) {
		super(logger);
		this.bindRoutes('', [
			{ method: 'get', path: '/healthz', func: this.healthz },
			{ method: 'get', path: '/ready', func: this.ready }
		]);
	}

	async healthz(req: Request, res: Response): Promise<void> {
		req.log.info('Healthz check');
		res.status(200).send({ status: 'ok' });
	}

	async ready(req: Request, res: Response): Promise<void> {
		try {
			await this.commonDatabase.client.$queryRaw`SELECT 1`;
			await this.moviesDatabase.client.$queryRaw`SELECT 1`;
			req.log.info('Readiness check OK');
			res.status(200).send({ status: 'ready' });
		} catch (error) {
			res.status(HttpStatus.SERVICE_UNAVAILABLE);
		}
	}
}
