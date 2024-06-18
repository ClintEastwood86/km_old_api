import { Role } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { BaseMiddleware } from '../common/base.middleware';
import { UserRole } from '../enums/role.enum';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { ILoggerService } from '../logger/logger.service.interface';
import { IUsersService } from '../users/users.service.interface';

export class RoleGuard extends BaseMiddleware {
	constructor(private role: Role, private logger: ILoggerService, private usersService: IUsersService) {
		super();
	}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		const user = await this.usersService.findUserByEmail(req.user);
		if (!user) {
			return next(
				new HTTPError(HttpStatus.FORBIDDEN, 'roleGuard', 'Не найден', { error: `Пользователь с email ${req.user} не найден` })
			);
		}
		if (UserRole[this.role] > UserRole[user.role]) {
			return next(
				new HTTPError(HttpStatus.FORBIDDEN, 'roleGuard', 'Недостаточно прав', {
					error: `Для выполнения данной операции требуется роль не ниже ${this.role}`
				})
			);
		}
		next();
	}
}
