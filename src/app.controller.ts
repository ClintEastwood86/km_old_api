import { inject, injectable } from 'inversify';
import { BaseController } from './common/base.controller';
import { ILoggerService } from './logger/logger.service.interface';
import { TYPES } from './types';
import { Request, Response } from 'express';
import { HttpStatus } from './helpers/http-status';
import { CommonDatabase } from './database/common.database';
import { MoviesDatabase } from './database/movies.database';
import { metricsHandler } from './common/metrics';

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
			{ method: 'get', path: '/ready', func: this.ready },
			{ method: 'get', path: '/metrics', func: this.metrics }
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
			res.status(200).send({ status: 'ready' });
		} catch (err) {
			req.log.error({ err }, 'Database not ready');
			res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ status: 'db unavailable' });
		}
	}

	async metrics(req: Request, res: Response): Promise<void> {
		res.setHeader('Content-Type', 'text/plain');
		res.send(await metricsHandler());
	}
}
