import { Request, Response, NextFunction } from 'express';
import { BaseMiddleware } from '../common/base.middleware';
import { IConfigService } from '../configs/config.service.interface';
import { ILoggerService } from '../logger/logger.service.interface';
import { IUsersService } from '../users/users.service.interface';

export class AuthGuard extends BaseMiddleware {
	constructor(private configService: IConfigService, private usersService: IUsersService, private logger: ILoggerService) {
		super();
	}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		next(await this.usersService.runAuthGuardCheck(req.cookies.accessToken, req.cookies.refreshToken, res));
	}
}
