import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { TYPES } from '../types';
import 'reflect-metadata';
import { IRanksService } from './ranks.service.interface';
import { ILoggerService } from '../logger/logger.service.interface';
import { NextFunction, Request, Response } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { IConfigService } from '../configs/config.service.interface';
import { AuthGuard } from '../middlewares/auth.guard';
import { IUsersService } from '../users/users.service.interface';
import { RoleGuard } from '../middlewares/role.guard';
import { Role } from '@prisma/client';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { RankCreateDto } from './dto/rank-create.dto';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { ICacheService } from '../cache/cache.service.interface';
import { objectToSearchParams } from '../helpers/object-to-params';

@injectable()
export class RanksController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IRanksService) private ranksService: IRanksService,
		@inject(TYPES.CacheService) private cache: ICacheService
	) {
		super(logger);
		this.bindRoutes('ranks', [
			{ path: '/get/:id', method: 'get', func: this.getById },
			{ path: '/get', method: 'get', func: this.get },
			{
				path: '/history/get',
				method: 'get',
				func: this.getHistory,
				middlewares: [new AuthMiddleware(configService), new AuthGuard(configService, usersService, logger)]
			},
			{
				path: '/create',
				method: 'post',
				func: this.createRank,
				middlewares: [
					new AuthMiddleware(configService),
					new AuthGuard(configService, usersService, logger),
					new RoleGuard(Role.ADMIN, logger, usersService),
					new ValidateMiddleware(RankCreateDto)
				]
			},
			{
				path: '/update/:id',
				method: 'put',
				func: this.updateRank,
				middlewares: [
					new AuthMiddleware(configService),
					new AuthGuard(configService, usersService, logger),
					new RoleGuard(Role.ADMIN, logger, usersService),
					new ValidateMiddleware(RankCreateDto)
				]
			}
		]);
	}

	async createRank({ body, log }: Request<{}, {}, RankCreateDto>, res: Response, next: NextFunction): Promise<void> {
		const rank = await this.ranksService.create(body, log);
		if (rank instanceof Error) {
			return next(rank);
		}
		this.create(res, rank);
	}

	async updateRank(
		{ body, params, log }: Request<Record<string, string>, {}, RankCreateDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'updateRank', 'Неправильно переданы данные', {
					error: 'Параметр id должен быть числом'
				})
			);
		}
		const rank = await this.ranksService.update(Math.floor(id), body, log);
		if (rank instanceof Error) {
			return next(rank);
		}
		this.create(res, rank);
	}

	async get(req: Request, res: Response, next: NextFunction): Promise<void> {
		const cacheKey = `ranks:all`;
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}

		const ranksOrError = await this.ranksService.getAllRanks();
		if (ranksOrError instanceof Error) {
			return next(ranksOrError);
		}
		this.cache.set(cacheKey, ranksOrError, 1000 * 60 * 60).catch(() => null);
		this.ok(res, ranksOrError);
	}

	async getById({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		const rankId = Number(params.id);

		const cacheKey = `ranks:${rankId}`;
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}

		const rankOrError = await this.ranksService.getRank(rankId);
		if (rankOrError instanceof Error) {
			return next(rankOrError);
		}

		this.cache.set(cacheKey, rankOrError, 1000 * 60 * 60).catch(() => null);
		this.ok(res, rankOrError);
	}

	async getHistory({ user, query }: Request, res: Response, next: NextFunction): Promise<void> {
		let take: number | undefined = Number(query.take);
		let skip: number | undefined = Number(query.skip);

		take = !Number.isNaN(take) ? Math.max(take, 5) : undefined;
		skip = !Number.isNaN(skip) ? Math.max(skip, 0) : undefined;

		const cacheKey = `ranks:history:${objectToSearchParams({ user, take, skip })}`;
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}

		const historyOrError = await this.ranksService.getHistory(user, { take, skip });
		if (historyOrError instanceof Error) {
			return next(historyOrError);
		}
		this.cache.set(cacheKey, historyOrError, 1000 * 60).catch(() => null);
		this.ok(res, historyOrError);
	}
}
