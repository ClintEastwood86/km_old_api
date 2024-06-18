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

@injectable()
export class RanksController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IRanksService) private ranksService: IRanksService
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

	async createRank({ body }: Request<{}, {}, RankCreateDto>, res: Response, next: NextFunction): Promise<void> {
		const rank = await this.ranksService.create(body);
		if (rank instanceof Error) {
			return next(rank);
		}
		this.create(res, rank);
	}

	async updateRank(
		{ body, params }: Request<Record<string, string>, {}, RankCreateDto>,
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
		const rank = await this.ranksService.update(Math.floor(id), body);
		if (rank instanceof Error) {
			return next(rank);
		}
		this.create(res, rank);
	}

	async get(req: Request, res: Response, next: NextFunction): Promise<void> {
		const ranksOrError = await this.ranksService.getAllRanks();
		if (ranksOrError instanceof Error) {
			next(ranksOrError);
		}
		this.ok(res, ranksOrError);
	}

	async getById({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		const rankOrError = await this.ranksService.getRank(Number(params.id));
		if (rankOrError instanceof Error) {
			return next(rankOrError);
		}
		this.ok(res, rankOrError);
	}

	async getHistory({ user, query }: Request, res: Response, next: NextFunction): Promise<void> {
		const take = Number(query.take);
		const skip = Number(query.skip);
		const historyOrError = await this.ranksService.getHistory(user, {
			take: !Number.isNaN(take) ? Math.max(take, 5) : undefined,
			skip: !Number.isNaN(skip) ? Math.max(skip, 0) : undefined
		});
		if (historyOrError instanceof Error) {
			return next(historyOrError);
		}
		this.ok(res, historyOrError);
	}
}
