import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { IConfigService } from '../configs/config.service.interface';
import { ILoggerService } from '../logger/logger.service.interface';
import { AuthGuard } from '../middlewares/auth.guard';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RoleGuard } from '../middlewares/role.guard';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { TYPES } from '../types';
import { IUsersService } from '../users/users.service.interface';
import { PointsItemCreateDto } from './dto/pointItem-create.dto';
import { IPointsItemsService } from './pointsItems.service.interface';

@injectable()
export class PointsItemController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IPointsItemService) private pointsItemService: IPointsItemsService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.IUsersService) private usersService: IUsersService
	) {
		super(logger);

		const authMiddleware = new AuthMiddleware(configService);
		const authGuard = new AuthGuard(configService, usersService, logger);

		this.bindRoutes('points', [
			{ path: '/get/:id', method: 'get', func: this.getById },
			{ path: '/get', method: 'get', func: this.get },
			{
				path: '/create',
				method: 'post',
				func: this.createPointsItem,
				middlewares: [
					authMiddleware,
					authGuard,
					new RoleGuard('ADMIN', logger, usersService),
					new ValidateMiddleware(PointsItemCreateDto)
				]
			}
		]);
	}

	async createPointsItem({ body }: Request<{}, {}, PointsItemCreateDto>, res: Response, next: NextFunction): Promise<void> {
		const pointsItem = await this.pointsItemService.createPointsItem(body);
		if (pointsItem instanceof Error) {
			return next(pointsItem);
		}
		this.ok(res, pointsItem);
	}

	async get(req: Request, res: Response, next: NextFunction): Promise<void> {
		const pointsItems = await this.pointsItemService.get();
		if (pointsItems instanceof Error) {
			return next(pointsItems);
		}
		this.ok(res, pointsItems);
	}

	async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
		const pointsItem = await this.pointsItemService.getPointsItemById(Number(req.params.id));
		if (pointsItem instanceof Error) {
			return next(pointsItem);
		}
		this.ok(res, pointsItem);
	}
}
