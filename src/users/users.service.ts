import { inject, injectable } from 'inversify';
import { FileElementResponse } from '../files/dto/files-element.response';
import { IFilesService } from '../files/files.service.interface';
import { ILoggerService } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { AwardCategory, Prisma, Role, UserModel } from '@prisma/client';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { User } from './user.entity';
import { Response } from 'express';
import {
	ISearchUserOptions,
	IUsersService,
	ReturnTypeUserWithIcon,
	UserModelForAdmin,
	UserModelOther
} from './users.service.interface';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { IUsersRepository } from './users.repository.interface';
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { JwtResponse } from '../common/controller.types';
import { IConfigService } from '../configs/config.service.interface';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { HTTPErrorConstructor } from '../helpers/http-error-constructor';
import { IAwardsService } from '../awards/awards.service.interface';
import { randomBytes, randomUUID } from 'crypto';
import { IEmailService } from '../email/email.service.interface';
import { IRanksService } from '../ranks/ranks.service.interface';
import { GetUsersForAdminPanelDto } from './dto/get-users-for-admin-panel.dto';
import { cookieConfig } from '../configs/cookie.config';
import { Logger } from 'pino';

@injectable()
export class UsersService implements IUsersService {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IFilesService) private filesService: IFilesService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.IRanksService) private ranksService: IRanksService,
		@inject(TYPES.IAwardsService) private awardsService: IAwardsService,
		@inject(TYPES.IUsersRepository) private usersRepository: IUsersRepository,
		@inject(TYPES.IEmailService) private emailService: IEmailService
	) {}

	async createUser({ email, password, login, notification }: UserRegisterDto, logger: Logger): Promise<UserModel | HTTPError> {
		const error = new HTTPError(HttpStatus.UNPROCESSABLE_ENTITY, 'usersRegister', 'Конфликт имён', {
			error: 'Пользователь с таким email или login уже существует'
		});
		const oldUser = await this.usersRepository.findFirstUserBy({ OR: [{ email }, { login }] });
		if (oldUser) {
			return error;
		}

		const findUserByCurrentLogin = await this.usersRepository.findUsersBy({
			login: {
				contains: login,
				mode: Prisma.QueryMode.insensitive
			}
		});

		for (const user of findUserByCurrentLogin) {
			if (user.login.toLowerCase() == login.toLowerCase()) {
				return error;
			}
		}

		const salt = this.configService.get('SALT');
		const newUser = new User({
			email,
			login,
			notification,
			confirmToken: this.generateOtherToken(login),
			notificationToken: this.generateOtherToken(login)
		});
		await newUser.setPassword(password, Number(salt));
		const createdUser = await this.usersRepository.createUser(newUser);
		if (!createdUser) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'usersRegister', 'Не удалось', {
				error: 'Ошибка на сервере, пользователь не создан'
			});
		}
		logger.info(`[UsersService] Пользователь с email: ${email} успешно зарегистрирован`);

		if (createdUser.confirmToken) {
			const result = await this.emailService.sendConfirmEmail(createdUser.email, createdUser.login, createdUser.confirmToken);
			if (result instanceof HTTPError) return result;
		}

		await this.awardsService.updateOpenAwardsInUser(createdUser.id, AwardCategory.RANKS, logger);
		await this.awardsService.updateOpenAwardsInUser(createdUser.id, AwardCategory.REGISTER, logger);
		await this.awardsService.updateOpenAwardsInUser(createdUser.id, AwardCategory.POINTS, logger);

		return createdUser;
	}

	async authUser({ email, password }: UserLoginDto, logger: Logger): Promise<JwtResponse | HTTPError> {
		const user = await this.checkPassword(email, password);
		if (user instanceof HTTPError) {
			return user;
		}
		if (!user) {
			return new HTTPError(HttpStatus.UNAUTHORIZED, 'usersAuth', `Ошибка авторизации пользователя с email ${email}`, {
				error: 'Неверный пароль'
			});
		}
		if (!user.userModel.verified) {
			return new HTTPError(HttpStatus.UNAUTHORIZED, 'userAuth', 'Аккаунт не подтверждён', {
				error: 'Почта не подтверждена',
				email: this.emailMasking(user.userModel.email)
			});
		}

		if (user.userModel.blocked) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'userAuth', 'Аккаунт заблокирован', {
				error: 'Этот аккаунт заблокирован'
			});
		}

		logger.info(`[UsersService] Пользователь с email: ${email} успешно авторизован`);

		return await this.refreshJwt(email);
	}

	async getUsersForAdminPanel(dto: GetUsersForAdminPanelDto, email: string): Promise<UserModelForAdmin[]> {
		const admin = await this.searchUser(email);
		const users = await this.usersRepository.findUsersForAdminPanel(dto);
		if (admin instanceof Error || admin.role !== Role.ADMIN) {
			return users.map(({ email, ...user }) => user);
		}
		return users;
	}

	async sendBanEmail(userId: number, emailAdmin: string, message: string, logger: Logger, login?: string): Promise<void> {
		if (Number.isNaN(userId)) {
			return this.logger.error('[sendBanEmail] Ошибка: 404 Не найден пользователь');
		}
		const admin = await this.findUserByEmail(emailAdmin);
		const user = await this.usersRepository.findFirstUserBy({ id: userId });
		if (!user || !admin) {
			return this.logger.error('[sendBanEmail] Ошибка: 404 Не найден пользователь');
		}
		const result = await this.emailService.sendBanEmail(user.email, login || user.login, admin.login, message);
		if (result instanceof Error) {
			return this.logger.error('[sendBanEmail] Ошибка 500 Не удалось отправить письмо');
		}
		logger.info(
			`[UsersService] Пользователь ${login || user.login} (${user.login}) был успешно заблокирован администратором с id ${
				admin.id
			} (${admin.login})`
		);
	}

	async stateBlockUser(id: number, action: 'block' | 'unblock'): Promise<(UserModel & { oldLogin?: string }) | HTTPError> {
		const serverError = new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'stateBlockUser', 'Ошибка на сервере', {
			error: 'Произошла ошибка в базе данных'
		});
		switch (action) {
			case 'block': {
				const newLogin = randomBytes(7).toString('hex');
				const user = await this.usersRepository.blockUserById(id, newLogin);
				if (!user) {
					return serverError;
				}
				return { ...user, oldLogin: user.oldLogin ?? user.login };
			}
			case 'unblock': {
				const user = await this.usersRepository.unblockUserById(id);
				if (!user) {
					return serverError;
				}
				return user;
			}
		}
	}

	async addPoints(email: string, userId: number, points: number, message: string, logger: Logger): Promise<number | HTTPError> {
		const user = await this.usersRepository.findFirstUserBy({ id: userId });
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'addPoints', 'Не найдено', { error: `Пользователь с id ${userId} не найден` });
		}
		const result = await this.ranksService.addPoints(
			{ email: user.email, logName: message, points, useMultiplier: false },
			logger
		);
		if (typeof result == 'number') {
			logger.info(`[ADMIN | ${email}] Добавлено ${points} очков пользователю ${user.login}`);
		}
		return result;
	}

	async confirmUserAccount(token: string): Promise<HTTPError | JwtResponse> {
		const login = token.split('_')[1];
		if (!login || token.length < 40) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'confirmUserAccount', 'Поврежденный токен', {
				error: 'Токен имеет неверный формат'
			});
		}
		const user = await this.usersRepository.findFirstUserBy({ login });
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'confirmUserAccound', 'Пользователь не найден', {
				error: `Пользователь с логином ${login} не найден`
			});
		}
		if (user.confirmToken !== token) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'confirmUserAccound', 'Токен неверен', {
				error: `Предоставленный токен отличается с тем, который находится в базе данных`
			});
		}
		const result = await this.usersRepository.updateUser(user.email, { confirmToken: null, verified: true });
		if (!result) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'confirmUserAccount', 'Ошибка на сервере', {
				error: 'Не удалось обновить данные'
			});
		}
		return this.refreshJwt(result.email);
	}

	async updateAvatar(email: string, file: Express.Multer.File, logger: Logger): Promise<FileElementResponse | HTTPError> {
		if (file.size > 1_572_864) {
			return new HTTPError(HttpStatus.PAYLOAD_TOO_LARGE, 'updateAvatar', 'Файл слишком большой', {
				error: 'Файл не должен превышать размер больше 1.5МБ'
			});
		}

		const oldAvatarUrl = await this.usersRepository.findUserAndSelect('avatar', { email });

		if (!oldAvatarUrl) {
			return HTTPErrorConstructor.userNotFoundError(email);
		}

		const fileElementResponse = await this.filesService.saveFile(file);
		await this.usersRepository.updateUser(email, {
			avatar: fileElementResponse.url,
			updatedAvatarAt: new Date()
		});

		if (oldAvatarUrl.avatar) {
			await this.filesService.deleteFile(oldAvatarUrl.avatar);
		}

		logger.info(`[UsersService] Пользователь ${email} успешно сменил аватарку`);

		return fileElementResponse;
	}

	async findUserByEmail(email: string): Promise<UserModel | null> {
		return await this.usersRepository.findUnique(email, true);
	}

	async findUserById(userId: number): Promise<UserModel | null> {
		return await this.usersRepository.findFirstUserBy({ id: userId });
	}

	async findUserByJwt(email: string): Promise<ReturnTypeUserWithIcon | HTTPError> {
		const user = await this.findUserByEmail(email);
		if (!user) {
			return HTTPErrorConstructor.userNotFoundError(email);
		}
		return user;
	}

	async getPaths(): Promise<number[]> {
		return await this.usersRepository.getIdUsers();
	}

	async findUserModelOther(id: number): Promise<UserModelOther | HTTPError> {
		const user = await this.usersRepository.findOtherUser(id);
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'findUserModelOther', 'Не найдено', {
				error: `Пользователь с id ${id} не найден`
			});
		}
		return user;
	}

	async changeLogin(email: string, value: string, logger: Logger): Promise<void | HTTPError> {
		const loginChangePeriod = Number(this.configService.get('LOGIN_CHANGE_PERIOD'));
		const findUserByCurrentLogin = await this.usersRepository.findUsersBy({
			login: {
				contains: value,
				mode: 'insensitive'
			}
		});

		for (const user of findUserByCurrentLogin) {
			if (user.login.toLowerCase() == value.toLowerCase()) {
				return new HTTPError(HttpStatus.FORBIDDEN, 'changeLogin', 'Занято', { error: 'Данный логин уже занят' });
			}
		}

		const user = await this.usersRepository.findUnique(email);

		if (!user) {
			return HTTPErrorConstructor.userNotFoundError(email);
		}

		if (user.updatedLoginAt && !this.checkTime(user.updatedLoginAt, loginChangePeriod)) {
			const currentDateChange = user.updatedLoginAt.getTime() + 1000 * 60 * 60 * 24 * loginChangePeriod;
			return new HTTPError(HttpStatus.FORBIDDEN, 'changeLogin', 'Слишком часто', {
				error: `В следующий раз вы сможете обновить свой логин ${new Date(currentDateChange).toLocaleString('ru')} МСК`
			});
		}

		await this.usersRepository.updateUser(email, {
			login: value,
			updatedLoginAt: new Date(),
			notificationToken: user.notificationToken.replace(user.login, value)
		});

		logger.info(`[UsersService] Пользователь ${email} сменил логин на ${value}`);
	}

	async changePassword(email: string, value: UserChangePasswordDto, logger: Logger): Promise<void | HTTPError> {
		const user = await this.checkPassword(email, value.oldPassword);
		if (user instanceof HTTPError) {
			return user;
		}
		if (!user) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'changePassword', 'Неверный пароль', {
				error: 'Текущий пароль введен неверно'
			});
		}

		const salt = this.configService.get('SALT');
		await user.entity.setPassword(value.newPassword, Number(salt));

		await this.usersRepository.updateUser(email, { password: user.entity.password });
		logger.info(`[UsersService] Пользователь ${email} успешно сменил пароль`);
	}

	async changePasswordWithToken(token: string, newPassword: string, logger: Logger): Promise<UserModel | HTTPError> {
		const user = await this.usersRepository.findFirstUserBy({ forgotPasswordToken: token });
		if (!user) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'changePasswordWithToken', 'Неверный токен', {
				error: 'Токен недействителен'
			});
		}

		const salt = this.configService.get('SALT');
		const entity = new User(
			{
				login: user.login,
				email: user.email,
				notification: user.notification,
				confirmToken: user.confirmToken || '',
				notificationToken: user.notificationToken
			},
			user.password
		);
		await entity.setPassword(newPassword, Number(salt));

		const updatedUser = await this.usersRepository.updateUser(user.email, { password: entity.password });
		if (!updatedUser) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'changePasswordWithToken', 'Ошибка на сервере', {
				error: 'Не удалось сменить пароль. Попробуйте позже'
			});
		}

		await this.usersRepository.updateUser(user.email, { forgotPasswordToken: null });

		logger.info(`[UsersService] Пользователь ${user.email} успешно сменил пароль`);
		return updatedUser;
	}

	async forgotPassword(email: string, logger: Logger): Promise<void | HTTPError> {
		const user = await this.usersRepository.findUnique(email);
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'forgotPassword', 'Не найден', {
				error: `Пользователь с email ${email} не найден`
			});
		}
		const token = randomUUID();
		const updatedUser = await this.usersRepository.updateUser(email, { forgotPasswordToken: token });

		if (!updatedUser) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'forgotPassword', 'Ошибка на сервере', {
				error: 'Не удалось запросить смену пароля. Попробуйте позже'
			});
		}

		const sendEmailResult = await this.emailService.sendForgotPasswordEmail(updatedUser.email, updatedUser.login, token);
		if (sendEmailResult instanceof Error) {
			return sendEmailResult;
		}
		logger.info(`[UsersService] Пользователь ${updatedUser.email} запросил смену пароля`);
	}

	async refreshJwt(email: string): Promise<JwtResponse> {
		return {
			jwtAccess: await this.signJwt(email, 'access'),
			jwtRefresh: await this.signJwt(email, 'refresh')
		};
	}

	async changeNotification(email: string, logger: Logger): Promise<void | HTTPError> {
		const user = await this.searchUser(email, {
			context: 'changeNotification',
			message: `Пользователь с email ${email} не найден`
		});
		if (user instanceof Error) {
			return user;
		}
		await this.usersRepository.updateUser(email, { notification: !user.notification });
		logger.info(`[UsersService] Пользователь ${user.login} ${user.notification ? 'выключил' : 'включил'} режим уведомления`);
	}

	async changeEmail(email: string, newEmail: string, logger: Logger): Promise<void | HTTPError> {
		const emailChangePeriod = Number(this.configService.get('EMAIL_CHANGE_PERIOD'));
		const user = await this.searchUser(email, { context: 'changeEmail' });
		if (user instanceof Error) {
			return user;
		}

		if (user.updatedEmailAt && !this.checkTime(user.updatedEmailAt, emailChangePeriod)) {
			const currentDateChange = user.updatedEmailAt.getTime() + 1000 * 60 * 60 * 24 * emailChangePeriod;
			return new HTTPError(HttpStatus.FORBIDDEN, 'changeEmail', 'Слишком часто меняете почту', {
				error: `В следующий раз вы сможете изменить почту ${new Date(currentDateChange).toLocaleString('ru')} МСК`
			});
		}

		const updatedUser = await this.usersRepository.updateUser(email, {
			email: newEmail,
			updatedEmailAt: new Date(),
			verified: false,
			confirmToken: this.generateOtherToken(user.login)
		});
		if (!updatedUser) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'changeEmail', 'Ошибка на сервере', {
				error: 'Не удалось сменить почту. Попробуйте позже'
			});
		}

		const sendEmailResult = await this.emailService.sendConfirmEmail(
			updatedUser.email,
			updatedUser.login,
			updatedUser.confirmToken || 'ERROR_500'
		);
		if (sendEmailResult instanceof Error) {
			return sendEmailResult;
		}

		logger.info(`[UsersService] Пользователь ${user.email} запросил смену email с ${email} на ${newEmail}`);
	}

	async deleteAccount({ email, password }: UserLoginDto): Promise<void | HTTPError> {
		const user = await this.checkPassword(email, password);
		if (user instanceof HTTPError) {
			return user;
		}
		if (!user) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'deleteAccount', 'Неверный пароль', {
				error: 'Текущий пароль введен неверно'
			});
		}

		await this.usersRepository.deleteUser(email);
		this.logger.warn(`Пользователь с email ${email} удалил свой аккаунт`);
	}

	async changeSelectedAward(email: string, awardId: number): Promise<void | HTTPError> {
		const user = await this.searchUser(email);
		if (user instanceof Error) {
			return user;
		}
		if (!(await this.usersRepository.getAwardsIdByUserId(user.id)).includes(awardId) && awardId !== 0) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'changeSelectedAward', 'Не найдено или не открыто', {
				error: `Награда с id ${awardId} не найдена или не открыта`
			});
		}
		this.usersRepository.updateUser(email, { awardId: awardId == 0 ? null : awardId });
	}

	async getIdOpenAwards(email: string): Promise<number[] | HTTPError> {
		const user = await this.searchUser(email);
		if (user instanceof Error) {
			return user;
		}
		const awards = await this.usersRepository.getAwardsIdByUserId(user.id);
		if (!awards.length) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getIdOpenAwards', 'Не найдено', {
				error: 'Не найдена ни одна открытая награда'
			});
		}
		return awards;
	}

	async toggleMarkMovie(email: string, movieId: number): Promise<number | HTTPError> {
		const user = await this.searchUser(email);
		if (user instanceof Error) {
			return user;
		}
		const isHasThisMark = await this.hasMarkInMovie(email, movieId);
		let result: Awaited<ReturnType<IUsersRepository['removeMark'] | IUsersRepository['addMark']>> = null;
		if (isHasThisMark) {
			result = await this.usersRepository.removeMark(email, movieId);
		} else {
			result = await this.usersRepository.addMark(email, movieId);
		}
		if (result === null) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'toggleMarkMovie', 'Оишбка на сервере', {
				error: 'Ошибка, попробуйте позже'
			});
		}
		return result;
	}

	async hasMarkInMovie(email: string, id: number): Promise<boolean> {
		return await this.usersRepository.hasMarkById(email, id);
	}

	async offNotificationByToken(token: string): Promise<void | Error> {
		const tuple = token.split('_');
		if (token.length < 40 || tuple.length !== 2) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'offNotificationByToken', 'Неверный формат', {
				error: `Токен ${token} имеет неверный формат`
			});
		}
		const user = await this.usersRepository.findFirstUserBy({ login: tuple[1] });
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'offNotificationByToken', 'Не найден', {
				error: 'Пользователь не найден'
			});
		}
		if (user.notificationToken !== token) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'offNotificationByToken', 'Токены не сопрадают', {
				error: `Токен ${token} не совпадает с тем, который находится в базе данных`
			});
		}
		try {
			await this.usersRepository.updateUser(user.email, { notification: false });
		} catch (error) {
			if (error instanceof Error) {
				return error;
			}
		}
		this.logger.warn(`Пользователь ${user.email} отказался от уведомлений`);
	}

	async searchUser(email: string, options?: ISearchUserOptions): Promise<UserModel | HTTPError> {
		const user = await this.usersRepository.findUnique(email);
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, options?.context || 'searchUser', 'Не найдено', {
				error: options?.message || `Пользователь ${email} не найден`
			});
		}
		return user;
	}

	async getCountCollections(email: string): Promise<number> {
		return await this.usersRepository.getCountCollections(email);
	}

	async runAuthGuardCheck(accessToken: string, refreshToken: string, res: Response, logger: Logger): Promise<void | HTTPError> {
		try {
			const accessTokenPayload = verify(accessToken, this.configService.get('ACCESS_TOKEN_SECRET')) as JwtPayload;
			const user = await this.findUserByEmail(accessTokenPayload.email);
			if (user && user.blocked) {
				return new HTTPError(HttpStatus.FORBIDDEN, 'authGuard', 'Ваш аккаунт заблокирован', {
					error: 'Ваш аккаунт заблокирован'
				});
			}
			if (this.tokenVerify(accessTokenPayload.expiries)) {
				return;
			}
			const refreshTokenPayload = verify(refreshToken, this.configService.get('REFRESH_TOKEN_SECRET')) as JwtPayload;
			const jwt = await this.refreshJwt(refreshTokenPayload.email);
			if (this.tokenVerify(refreshTokenPayload.expiries)) {
				logger.info(`[AuthGuard] Access токен пользователя ${accessTokenPayload.email} просрочен. REFRESH`);
				res.cookie('accessToken', jwt.jwtAccess, cookieConfig.access);
				return;
			}
			res.cookie('accessToken', jwt.jwtAccess, cookieConfig.access);
			res.cookie('refreshToken', jwt.jwtRefresh, cookieConfig.refresh);
			logger.info(`[AuthGuard] Оба токена пользователя ${refreshTokenPayload.email} просрочены REFRESH`);
		} catch (error) {
			return new HTTPError(HttpStatus.UNAUTHORIZED, 'authGuard', 'Не авторизован', {
				error: 'Не прошел авторизацию'
			});
		}
	}

	async setViewToken(email: string, token: string): Promise<string | null> {
		return await this.usersRepository.setViewToken(email, token);
	}

	async addViewTime(email: string, minutes: number): Promise<number> {
		return await this.usersRepository.addViewTime(email, minutes);
	}

	tokenVerify(expiries: number): boolean {
		return expiries * 1000 - Date.now() > 0;
	}

	private checkTime(time: Date, days: number): boolean {
		return time.getTime() + 1000 * 60 * 60 * 24 * days < Date.now();
	}

	private async checkPassword(
		userEmail: string,
		password: string
	): Promise<{ entity: User; userModel: UserModel } | void | HTTPError> {
		const user = await this.searchUser(userEmail, { context: 'checkPassword', message: 'Неверный email' });
		if (user instanceof Error) {
			return user;
		}
		const newUser = new User(
			{
				email: user.email,
				login: user.login,
				notification: user.notification,
				confirmToken: user.confirmToken || '',
				notificationToken: user.notificationToken
			},
			user.password
		);
		if (await newUser.comparePassword(password)) {
			return { entity: newUser, userModel: user };
		}
	}

	private signJwt = (email: string, type: 'access' | 'refresh'): Promise<string> => {
		return new Promise<string>((resolve, reject) => {
			sign(
				{
					email,
					iat: Math.floor(Date.now() / 1000),
					expiries:
						// Берется секунды текущего времени и слагаются со временем жизни токена (default: в минутах)
						Math.floor(Date.now() / 1000) +
						Number(this.configService.get(type == 'access' ? 'ACCESS_TOKEN_EXPIRIES' : 'REFRESH_TOKEN_EXPIRIES')) * 60
				},
				type == 'access' ? this.configService.get('ACCESS_TOKEN_SECRET') : this.configService.get('REFRESH_TOKEN_SECRET'),
				{
					algorithm: 'HS256'
				},
				(err, token) => {
					if (err) {
						return reject(err);
					}
					resolve(token as string);
				}
			);
		});
	};

	private emailMasking(email: string): string {
		const [login, emailService] = email.split('@');
		if (login.length <= 4) {
			return email;
		}
		return `${login.substring(0, 2)}${'*'.repeat(login.length - 4)}${login.substring(
			login.length - 2,
			login.length
		)}@${emailService}`;
	}

	private generateOtherToken(login: string): string {
		return `${randomBytes(20).toString('hex')}_${login}`;
	}
}
