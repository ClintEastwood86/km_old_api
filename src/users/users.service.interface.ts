import { UserModel } from '@prisma/client';
import { JwtResponse } from '../common/controller.types';
import { HTTPError } from '../errors/http-error';
import { FileElementResponse } from '../files/dto/files-element.response';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { AttachedMoviesInCollection } from '../collections/collections.types';
import { GetUsersForAdminPanelDto } from './dto/get-users-for-admin-panel.dto';
import { Response } from 'express';
import { Logger } from 'pino';

export interface IUsersService {
	createUser(dto: UserRegisterDto, logger: Logger): Promise<UserModel | HTTPError>;
	authUser(dto: UserLoginDto, logger: Logger): Promise<JwtResponse | HTTPError>;
	confirmUserAccount(token: string): Promise<HTTPError | JwtResponse>;
	updateAvatar(email: string, file: Express.Multer.File, logger: Logger): Promise<FileElementResponse | HTTPError>;
	findUserByEmail(email: string): Promise<UserModel | null>;
	findUserById(userId: number): Promise<UserModel | null>;
	refreshJwt(email: string): Promise<JwtResponse>;
	findUserByJwt(token: string): Promise<ReturnTypeUserWithIcon | HTTPError>;
	changeLogin(email: string, value: string, logger: Logger): Promise<void | HTTPError>;
	stateBlockUser(id: number, action: 'block' | 'unblock'): Promise<(UserModel & { oldLogin?: string }) | UserModel | HTTPError>;
	changePassword(email: string, value: UserChangePasswordDto, logger: Logger): Promise<void | HTTPError>;
	forgotPassword(email: string, logger: Logger): Promise<void | HTTPError>;
	changePasswordWithToken(token: string, newPassword: string, logger: Logger): Promise<UserModel | HTTPError>;
	changeNotification(email: string, logger: Logger): Promise<void | HTTPError>;
	changeEmail(email: string, newEmail: string, logger: Logger): Promise<void | HTTPError>;
	deleteAccount(dto: UserLoginDto): Promise<void | HTTPError>;
	changeSelectedAward(email: string, awardId: number): Promise<void | HTTPError>;
	getIdOpenAwards(email: string): Promise<number[] | HTTPError>;
	getPaths(): Promise<number[]>;
	getUsersForAdminPanel(dto: GetUsersForAdminPanelDto, email: string): Promise<UserModelForAdmin[]>;
	findUserModelOther(id: number): Promise<UserModelOther | HTTPError>;
	hasMarkInMovie(email: string, id: number): Promise<boolean>;
	toggleMarkMovie(email: string, movieId: number): Promise<HTTPError | number>;
	searchUser(email: string, options?: ISearchUserOptions): Promise<UserModel | HTTPError>;
	offNotificationByToken(token: string): Promise<void | Error>;
	getCountCollections(email: string): Promise<number>;
	setViewToken(email: string, token: string): Promise<string | null>;
	addPoints(email: string, userId: number, points: number, message: string, logger: Logger): Promise<number | HTTPError>;
	sendBanEmail(userId: number, emailAdmin: string, message: string, logger: Logger, login?: string): Promise<void>;
	runAuthGuardCheck(accessToken: string, refreshToken: string, res: Response, logger: Logger): Promise<void | HTTPError>;
	tokenVerify(expiries: number): boolean;
	addViewTime(email: string, minutes: number): Promise<number>;
}

export type UserModelShort = Pick<UserModel, 'email' | 'login' | 'avatar' | 'role' | 'rankId'>;

export type UserModelOther = Pick<
	UserModel,
	'avatar' | 'userPoints' | 'id' | 'rankId' | 'watchedMinutes' | 'login' | 'awardId'
> & {
	awardsOpen: { id: number }[];
	collections: AttachedMoviesInCollection[];
};

export interface ISearchUserOptions {
	message?: string;
	context: string;
}

export type UserModelWithIcon = UserModel & { awardSelected: { icon: string } };

export type ReturnTypeUserWithIcon = UserModelWithIcon | UserModel;

export type UserModelForAdmin = Pick<
	UserModel,
	'id' | 'login' | 'avatar' | 'role' | 'rankId' | 'awardId' | 'userPoints' | 'blocked'
> & { email?: string; awardSelected: { icon: string } | null };
