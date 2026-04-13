import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';
import { NextFunction, Request, Response } from 'express';
import { AwardCreateDto } from './dto/award-create.dto';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { IConfigService } from '../configs/config.service.interface';
import { AuthGuard } from '../middlewares/auth.guard';
import { IUsersService } from '../users/users.service.interface';
import { RoleGuard } from '../middlewares/role.guard';
import 'reflect-metadata';
import { IAwardsService } from './awards.service.interface';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { Role } from '@prisma/client';
import { UpdatePositionsDto } from './dto/update-positions.dto';
import { ICacheService } from '../cache/cache.service.interface';

@injectable()
export class AwardsController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IConfigService) private config: IConfigService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IAwardsService) private awardsService: IAwardsService,
		@inject(TYPES.CacheService) private cache: ICacheService
	) {
		super(logger);
		this.bindRoutes('awards', [
			{
				path: '/create',
				method: 'post',
				func: this.createAward,
				middlewares: [
					new AuthMiddleware(config),
					new AuthGuard(config, usersService, logger),
					new RoleGuard('ADMIN', logger, usersService),
					new ValidateMiddleware(AwardCreateDto)
				]
			},
			{
				path: '/get',
				method: 'get',
				func: this.get
			},
			{
				path: '/get/:id',
				method: 'get',
				func: this.getById
			},
			{
				path: '/delete/:id',
				method: 'delete',
				func: this.deleteById,
				middlewares: [
					new AuthMiddleware(config),
					new AuthGuard(config, usersService, logger),
					new RoleGuard('ADMIN', logger, usersService)
				]
			},
			{
				path: '/update/positions',
				method: 'put',
				func: this.updatePositions,
				middlewares: [
					new AuthMiddleware(config),
					new AuthGuard(config, usersService, logger),
					new RoleGuard(Role.ADMIN, logger, usersService),
					new ValidateMiddleware(UpdatePositionsDto)
				]
			},
			{
				path: '/update/:id',
				method: 'put',
				func: this.update,
				middlewares: [
					new AuthMiddleware(config),
					new AuthGuard(config, usersService, logger),
					new RoleGuard(Role.ADMIN, logger, usersService),
					new ValidateMiddleware(AwardCreateDto)
				]
			}
		]);
	}

	async createAward({ body, log }: Request<{}, {}, AwardCreateDto>, res: Response, next: NextFunction): Promise<void> {
		const awardOrError = await this.awardsService.create(body, log);
		if (awardOrError instanceof Error) {
			return next(awardOrError);
		}
		this.create(res, awardOrError);
	}

	async get(req: Request, res: Response, next: NextFunction): Promise<void> {
		const cacheKey = `awards:all`;
		const cachedResult = await this.cache.get(cacheKey).catch(() => null);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}

		const result = await this.awardsService.getAllAwards();
		if (result instanceof Error) {
			return next(result);
		}
		this.cache.set(cacheKey, result, 1000 * 60).catch(() => null);
		this.ok(res, result);
	}

	async getById({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'deleteById', 'Неправильно переданы данные', {
					error: 'Параметр id должен быть числом'
				})
			);
		}
		const cacheKey = `awards:${id}`;
		const cachedResult = await this.cache.get(cacheKey).catch(() => null);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}

		const award = await this.awardsService.getById(Math.floor(id));
		if (award instanceof Error) {
			return next(award);
		}
		this.cache.set(cacheKey, award, 1000 * 60).catch(() => null);
		this.ok(res, award);
	}

	async deleteById({ params, log }: Request, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'deleteById', 'Неправильно переданы данные', {
					error: 'Параметр id должен быть числом'
				})
			);
		}
		const award = await this.awardsService.deleteById(Math.floor(id), log);
		if (award instanceof Error) {
			return next(award);
		}
		this.ok(res, award);
	}

	async update(
		{ params, body }: Request<Record<string, string>, {}, AwardCreateDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'update', 'Неправильно переданы данные', {
					error: 'Параметр id должен быть числом'
				})
			);
		}
		const award = await this.awardsService.update(Math.floor(id), body);
		if (award instanceof Error) {
			return next(award);
		}
		this.ok(res, award);
	}

	async updatePositions({ body }: Request<{}, {}, UpdatePositionsDto>, res: Response, next: NextFunction): Promise<void> {
		if (body.awards.length > 200) {
			return next(
				new HTTPError(HttpStatus.FORBIDDEN, 'updatePositions', 'Превышен лимит', {
					error: 'Максимальная длина массива awards – 200'
				})
			);
		}
		for (const award of body.awards) {
			if (typeof award.id !== 'number' || typeof award.position !== 'number' || award.position < 0 || award.id < 0) {
				return next(
					new HTTPError(HttpStatus.BAD_REQUEST, 'updatePositions', 'Указано не валидное число', {
						error: 'Указано не вылидное число в поле id или position'
					})
				);
			}
		}
		await this.awardsService.updatePositions(body.awards);
		res.sendStatus(200);
	}
}
