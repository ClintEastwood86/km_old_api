import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { TYPES } from '../types';
import 'reflect-metadata';
import { ILoggerService } from '../logger/logger.service.interface';
import { ILeaderboardRepository } from './leaderboard.repository.interface';
import { NextFunction, Request, Response } from 'express';
import { ILeaderboardService } from './leaderboard.service.interface';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { AuthGuard } from '../middlewares/auth.guard';
import { RoleGuard } from '../middlewares/role.guard';
import { Role } from '@prisma/client';
import { IUsersService } from '../users/users.service.interface';
import { IConfigService } from '../configs/config.service.interface';

@injectable()
export class LeaderboardController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) logger: ILoggerService,
		@inject(TYPES.IConfigService) config: IConfigService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.ILeaderboardRepository) private leaderboardRepository: ILeaderboardRepository,
		@inject(TYPES.ILeaderboardService) private leaderboardService: ILeaderboardService
	) {
		super(logger);
		this.bindRoutes('leaderboard', [
			{
				path: '/:year/snapshot',
				method: 'post',
				func: this.saveLeaderboardSnapshot,
				middlewares: [
					new AuthMiddleware(config),
					new AuthGuard(config, usersService, logger),
					new RoleGuard(Role.MODERATOR, logger, usersService)
				]
			},
			{
				path: '/:year',
				method: 'get',
				func: this.getLeaderboardByYear,
				middlewares: [new AuthMiddleware(config)]
			}
		]);
	}

	async saveLeaderboardSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const year = Number(req.params.year);
			if (Number.isNaN(year)) {
				throw new HTTPError(HttpStatus.BAD_REQUEST, 'saveLeaderboardSnapshot', 'Год указан неверно', {
					error: 'Год указан неверно'
				});
			}
			const result = await this.leaderboardService.createYearlySnapshot(year);
			this.create(res, result);
		} catch (error) {
			if (error instanceof Error) {
				next(
					new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'saveLeaderboardSnapshot', 'Internal Server Error', {
						error: error.message
					})
				);
			}
		}
	}

	async getLeaderboardByYear(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const year = Number(req.params.year);
			if (Number.isNaN(year)) {
				throw new HTTPError(HttpStatus.BAD_REQUEST, 'getLeaderboardByYear', 'Год указан неверно', {
					error: 'Год указан неверно'
				});
			}

			const user = req.user ? await this.usersService.findUserByEmail(req.user) : null;
			const result = await this.leaderboardRepository.getSnapshotByYear(year, user?.id);
			if (!result.top.length) {
				throw new HTTPError(HttpStatus.NOT_FOUND, 'getLeaderboardByYear', 'Снимок отсутствует', {
					error: `Снимок ${year} года отсутствует`
				});
			}
			res.send(result);
		} catch (error) {
			if (error instanceof Error) {
				next(
					new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'getLeaderboardByYear', 'Internal Server Error', {
						error: error.message
					})
				);
			}
		}
	}
}
