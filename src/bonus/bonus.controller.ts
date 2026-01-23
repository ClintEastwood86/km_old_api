import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';
import { AuthGuard } from '../middlewares/auth.guard';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { IConfigService } from '../configs/config.service.interface';
import { IUsersService } from '../users/users.service.interface';
import { NextFunction, Request, Response } from 'express';
import { BonusCreateDto } from './dto/bonus-create.dto';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { RoleGuard } from '../middlewares/role.guard';
import { Role } from '@prisma/client';
import { IBonusService } from './bonus.service.interface';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';

@injectable()
export class BonusController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.IBonusService) private bonusService: IBonusService
	) {
		super(logger);
		const authMiddleware = new AuthMiddleware(configService);
		const authGuard = new AuthGuard(configService, usersService, logger);
		this.bindRoutes('bonus', [
			{
				path: '/create',
				method: 'post',
				func: this.createBonus,
				middlewares: [
					authMiddleware,
					authGuard,
					new RoleGuard(Role.ADMIN, logger, usersService),
					new ValidateMiddleware(BonusCreateDto)
				]
			},
			{
				path: '/common',
				method: 'get',
				func: this.getCommonMultiplier,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/common/:id',
				method: 'get',
				func: this.getCommonMultiplierByUserId
			},
			{
				path: '/holidays',
				method: 'get',
				func: this.getHolidays
			}
		]);
	}

	async createBonus({ body, user, log }: Request<{}, {}, BonusCreateDto>, res: Response, next: NextFunction): Promise<void> {
		const bonus = await this.bonusService.create(body, user, log);
		if (bonus instanceof Error) {
			return next(bonus);
		}
		this.ok(res, bonus);
	}

	async getCommonMultiplier({ user }: Request, res: Response, next: NextFunction): Promise<void> {
		const multiplier = await this.bonusService.getCommonMultiplier(user);
		if (!multiplier) {
			return next(
				new HTTPError(HttpStatus.NOT_FOUND, 'getCommonMultiplier', 'Не найден', {
					error: `Пользователь с email ${user} не найден`
				})
			);
		}
		this.ok(res, multiplier);
	}

	async getCommonMultiplierByUserId({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		if (Number.isNaN(Number(params.id))) {
			return next(
				new HTTPError(HttpStatus.NOT_FOUND, 'getCommonMultiplierByUserId', 'Не найден', {
					error: `Пользователь с id ${params.id} не найден`
				})
			);
		}
		const id = Math.max(Math.floor(Number(params.id)), 1);
		const multiplier = await this.bonusService.getCommonMultiplier(id);
		if (!multiplier) {
			return next(
				new HTTPError(HttpStatus.NOT_FOUND, 'getCommonMultiplierByUserId', 'Не найден', {
					error: `Пользователь с id ${id} не найден`
				})
			);
		}
		this.ok(res, multiplier);
	}

	async getHolidays(req: Request<{}, {}, BonusCreateDto>, res: Response): Promise<void> {
		this.ok(res, await this.bonusService.getHolidays());
	}
}
