import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { ILoggerService } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import 'reflect-metadata';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { EmailMiddleware } from '../middlewares/email.middleware';
import { FileInterceptor } from '../middlewares/file.interceptor';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { avatarUploadRequirements } from './users.constants';
import { IUsersService } from './users.service.interface';
import { formatsFile } from '../files/files.constants';
import { ConfigService } from '../configs/config.service';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { AuthGuard } from '../middlewares/auth.guard';
import { UserChangeLoginDto } from './dto/user-change-login.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserChangeEmailDto } from './dto/user-change-email.dto';
import { IRanksService } from '../ranks/ranks.service.interface';
import { isUserModelWithIcon } from './users.typeguards';
import { RoleGuard } from '../middlewares/role.guard';
import { Role } from '@prisma/client';
import { UserBlockDto } from './dto/user-block.dto';
import { AddPointsDto } from './dto/add-points.dto';
import { GetUsersForAdminPanelDto } from './dto/get-users-for-admin-panel.dto';
import { UserForgotPasswordDto } from './dto/user-forgot-password.dto';
import { UserChangePasswordWithTokenDto } from './dto/user-change-password-with-token.dto';

@injectable()
export class UsersController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IConfigService) private configService: ConfigService,
		@inject(TYPES.IRanksService) private ranksService: IRanksService
	) {
		super(logger);

		const fileInterceptor = new FileInterceptor();
		const authMiddleware = new AuthMiddleware(this.configService);
		const authGuard = new AuthGuard(this.configService, this.usersService, this.logger);
		const emailMiddleware = new EmailMiddleware();

		this.bindRoutes('users', [
			{ path: '/login', method: 'post', func: this.login, middlewares: [new ValidateMiddleware(UserLoginDto)] },
			{
				path: '/register',
				method: 'post',
				func: this.register,
				middlewares: [new ValidateMiddleware(UserRegisterDto), emailMiddleware]
			},
			{
				path: '/info',
				method: 'get',
				func: this.info,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/paths',
				method: 'get',
				func: this.getPaths
			},
			{
				path: '/user/:id',
				method: 'get',
				func: this.getUserInfo
			},
			{
				path: '/awards',
				method: 'get',
				func: this.getIdOpenAwards,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/mark/has/:id',
				method: 'get',
				func: this.hasMarkInMovie,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/upload/avatar',
				method: 'post',
				func: this.updateAvatar,
				middlewares: [fileInterceptor, authMiddleware, authGuard]
			},
			{
				path: '/change/login',
				method: 'put',
				func: this.changeLogin,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(UserChangeLoginDto)]
			},
			{
				path: '/change/password',
				method: 'put',
				func: this.changePassword,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(UserChangePasswordDto)]
			},
			{
				path: '/change/password/withToken',
				method: 'put',
				func: this.changePasswordWithToken,
				middlewares: [new ValidateMiddleware(UserChangePasswordWithTokenDto)]
			},
			{
				path: '/forgotPassword',
				method: 'post',
				func: this.forgotPassword,
				middlewares: [new ValidateMiddleware(UserForgotPasswordDto)]
			},
			{
				path: '/change/notification',
				method: 'put',
				func: this.changeNotification,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/change/email',
				method: 'put',
				func: this.changeEmail,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(UserChangeEmailDto), emailMiddleware]
			},
			{
				path: '/change/award/:id',
				method: 'put',
				func: this.changeSelectedAward,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/mark/:id',
				method: 'put',
				func: this.toggleMarkMovie,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/block/:id',
				method: 'put',
				func: this.blockAccount,
				middlewares: [
					authMiddleware,
					authGuard,
					new RoleGuard(Role.ADMIN, logger, usersService),
					new ValidateMiddleware(UserBlockDto)
				]
			},
			{
				path: '/unblock/:id',
				method: 'put',
				func: this.unblockAccount,
				middlewares: [authMiddleware, authGuard, new RoleGuard(Role.ADMIN, logger, usersService)]
			},
			{
				path: '/addPoints',
				method: 'post',
				func: this.addPoints,
				middlewares: [
					authMiddleware,
					authGuard,
					new RoleGuard(Role.ADMIN, logger, usersService),
					new ValidateMiddleware(AddPointsDto)
				]
			},
			{
				path: '/delete',
				method: 'delete',
				func: this.deleteAccount,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(UserLoginDto), emailMiddleware]
			},
			{ path: '/confirm/:token', method: 'put', func: this.confirmAccount },
			{ path: '/change/notification/:token', method: 'get', func: this.offNotificationByToken },
			{
				path: '/admin/users',
				method: 'post',
				func: this.getUsersForAdminPanel,
				middlewares: [
					authMiddleware,
					authGuard,
					new RoleGuard(Role.MODERATOR, logger, usersService),
					new ValidateMiddleware(GetUsersForAdminPanelDto)
				]
			}
		]);
	}

	async login({ body, log }: Request<{}, {}, UserLoginDto>, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.authUser(body, log);
		if (result instanceof Error) {
			return next(result);
		}
		this.setJwtTokens(res, result);
		this.ok(res, { accessToken: result.jwtAccess });
	}

	async register({ body, log }: Request<{}, {}, UserRegisterDto>, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.createUser(body, log);
		if (result instanceof Error) {
			return next(result);
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { confirmToken, notificationToken, ...returnData } = result;
		this.create(res, returnData);
	}

	async getPaths(req: Request, res: Response): Promise<void> {
		this.ok(res, await this.usersService.getPaths());
	}

	async info({ user, query }: Request, res: Response, next: NextFunction): Promise<void> {
		const userOrError = await this.usersService.findUserByJwt(user);
		if (userOrError instanceof Error) {
			this.clearCookie(res, ['accessToken', 'refreshToken']);
			return next(userOrError);
		}
		query?.type == 'short'
			? this.ok(res, {
					id: userOrError.id,
					avatar: userOrError.avatar,
					email: userOrError.email,
					login: userOrError.login,
					rankId: userOrError.rankId,
					role: userOrError.role,
					userPoints: userOrError.userPoints,
					awardSelected: isUserModelWithIcon(userOrError) ? { icon: userOrError.awardSelected.icon } : null
			  })
			: this.ok(res, userOrError);
	}

	async updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (!req.file || !formatsFile.images.includes('.' + req.file.mimetype.split('/')[1])) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'updateAvatar', 'Не выполняются все требования', {
					error: `Файл поврежден или файл не является фотографией ${formatsFile.images.join(' ')}`,
					requirements: avatarUploadRequirements
				})
			);
		}
		const result = await this.usersService.updateAvatar(req.user, req.file, req.log);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, result);
	}

	async addPoints({ body, user, log }: Request<{}, {}, AddPointsDto>, res: Response, next: NextFunction): Promise<void> {
		const resultPoints = await this.usersService.addPoints(user, body.userId, body.points, body.message, log);
		if (resultPoints instanceof Error) {
			return next(resultPoints);
		}
		this.ok(res, resultPoints);
	}

	async changeLogin({ body, user, log }: Request<{}, {}, UserChangeLoginDto>, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.changeLogin(user, body.login, log);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, {
			status: HttpStatus.OK
		});
	}

	async changePassword(
		{ body, user, log }: Request<{}, {}, UserChangePasswordDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const result = await this.usersService.changePassword(user, body, log);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, {
			status: HttpStatus.OK
		});
	}

	async changePasswordWithToken(
		{ body, log }: Request<{}, {}, UserChangePasswordWithTokenDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const result = await this.usersService.changePasswordWithToken(body.token, body.password, log);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, result);
	}

	async forgotPassword({ body, log }: Request<{}, {}, UserForgotPasswordDto>, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.forgotPassword(body.email, log);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, {
			status: HttpStatus.OK
		});
	}

	async getUsersForAdminPanel({ body, user }: Request<{}, {}, GetUsersForAdminPanelDto>, res: Response): Promise<void> {
		this.ok(res, await this.usersService.getUsersForAdminPanel(body, user));
	}

	async changeNotification({ user, log }: Request, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.changeNotification(user, log);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, {
			status: HttpStatus.OK
		});
	}

	async changeEmail({ user, body, log }: Request<{}, {}, UserChangeEmailDto>, res: Response, next: NextFunction): Promise<void> {
		if (user == body.email) {
			return next(
				new HTTPError(HttpStatus.FORBIDDEN, 'changeEmail', 'Одинаковые email', {
					error: 'Вы пытаетесь сменить почту на ту, которая стоит сейчас у вас'
				})
			);
		}
		const result = await this.usersService.changeEmail(user, body.email, log);
		if (result instanceof Error) {
			return next(result);
		}

		this.clearCookie(res, ['accessToken, refreshToken']);

		this.ok(res, {
			status: HttpStatus.OK
		});
	}

	async blockAccount(
		{ body, params, user, log }: Request<Record<string, string>, {}, UserBlockDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const result = await this.usersService.stateBlockUser(Number(params.id), 'block');
		if (result instanceof Error) {
			return next(result);
		}
		await this.usersService.sendBanEmail(Number(params.id), user, body.message, log, 'oldLogin' in result ? result.oldLogin : '');
		this.ok(res, result);
	}

	async unblockAccount({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.stateBlockUser(Number(params.id), 'unblock');
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, result);
	}

	async deleteAccount({ body }: Request<{}, {}, UserLoginDto>, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.deleteAccount(body);
		if (result instanceof Error) {
			return next(result);
		}
		this.clearCookie(res, ['accessToken, refreshToken']);
		this.ok(res, {
			status: HttpStatus.OK
		});
	}

	async getUserInfo({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		if (!params.id || Number.isNaN(Number(params.id))) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'getUserInfo', 'Плохой запрос', { error: 'Значение id передано неверно' })
			);
		}
		const userOrError = await this.usersService.findUserModelOther(Number(params.id));
		if (userOrError instanceof Error) {
			return next(userOrError);
		}
		this.ok(res, userOrError);
	}

	async changeSelectedAward({ params, user }: Request, res: Response, next: NextFunction): Promise<void> {
		if (!params || Number.isNaN(Number(params.id))) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'changeSelectedAward', 'Плохой запрос', { error: 'Значение id передано неверно' })
			);
		}
		const result = await this.usersService.changeSelectedAward(user, Number(params.id));
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, {
			status: HttpStatus.OK
		});
	}

	async getIdOpenAwards({ user }: Request, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.getIdOpenAwards(user);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, result);
	}

	async toggleMarkMovie({ user, params }: Request, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'toggleMarkMovie', '/mark/:id <-- id is NaN', {
					error: 'Параметр id не является числом'
				})
			);
		}
		const lengthMarksOrError = await this.usersService.toggleMarkMovie(user, Math.floor(id));
		if (lengthMarksOrError instanceof Error) {
			return next(lengthMarksOrError);
		}
		this.ok(res, lengthMarksOrError);
	}

	async hasMarkInMovie({ user, params }: Request, res: Response): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			this.ok(res, false);
			return;
		}
		this.ok(res, await this.usersService.hasMarkInMovie(user, id));
	}

	async confirmAccount({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.confirmUserAccount(params.token);
		if (result instanceof Error) {
			return next(result);
		}
		this.setJwtTokens(res, result);
		this.ok(res, { accessToken: result.jwtAccess });
	}

	async offNotificationByToken({ params }: Request, res: Response, next: NextFunction): Promise<void> {
		const result = await this.usersService.offNotificationByToken(params.token);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, { status: 'OK' });
	}
}
