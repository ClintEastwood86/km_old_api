import { Prisma, UserModel } from '@prisma/client';
import { IUsersRepository } from './users.repository.interface';
import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ReturnTypeUserWithIcon, UserModelForAdmin, UserModelOther } from './users.service.interface';
import { CommonDatabase } from '../database/common.database';
import { User } from './user.entity';
import { ILoggerService } from '../logger/logger.service.interface';
import { collectionIncludeConfig } from '../configs/collection-include.config';
import { ICollectionsRepository } from '../collections/collections.repository.interface';
import { AttachedMoviesInCollection } from '../collections/collections.types';
import { GetUsersForAdminPanelDto } from './dto/get-users-for-admin-panel.dto';
import { usersSorting } from '../enums/sort.enum';

@injectable()
export class UsersRepository implements IUsersRepository {
	constructor(
		@inject(TYPES.CommonDatabase) private database: CommonDatabase,
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.ICollectionsRepository) private collectionsRepository: ICollectionsRepository
	) {}

	async createUser({ notification, login, password, confirmToken, email, notificationToken }: User): Promise<UserModel | null> {
		try {
			return await this.database.client.userModel.create({
				data: { email, login, password, notification, confirmToken, notificationToken }
			});
		} catch (error) {
			return null;
		}
	}

	async findUnique(email: string, getIcon?: boolean): Promise<ReturnTypeUserWithIcon | null> {
		const options: {} | Prisma.UserModelFindUniqueArgs = getIcon
			? { include: { awardSelected: { select: { icon: true } } } }
			: {};

		return await this.database.client.userModel.findUnique({
			where: {
				email
			},
			...options
		});
	}

	async findUsersBy(where: Prisma.UserModelWhereInput): Promise<UserModel[]>;
	async findUsersBy(key: string, value: string): Promise<UserModel[]>;
	async findUsersBy(keyOrWhere: Prisma.UserModelWhereInput | string, value?: string): Promise<UserModel[]> {
		if (typeof keyOrWhere == 'string') {
			return await this.database.client.userModel.findMany({
				where: {
					[keyOrWhere]: value
				}
			});
		} else {
			return await this.database.client.userModel.findMany({ where: keyOrWhere });
		}
	}

	async findFirstUserBy(where: Prisma.UserModelWhereInput): Promise<UserModel | null> {
		return await this.database.client.userModel.findFirst({ where });
	}

	async updateUser(email: string, data: Partial<UserModel>): Promise<UserModel | null> {
		try {
			return await this.database.client.userModel.update({
				where: { email },
				data
			});
		} catch (error) {
			return null;
		}
	}

	async findUserAndSelect<T extends keyof UserModel>(
		select: T,
		where: Prisma.UserModelWhereInput
	): Promise<{ [key: string]: UserModel[T] } | null> {
		// Может не найти аватарку, но найти пользователя: {avatar: null}. Или не найти пользователя: null
		const res = await this.database.client.userModel.findFirst({ where, select: { [select]: true } });
		if (!res) {
			return null;
		}
		return res as unknown as Awaited<ReturnType<typeof UsersRepository.prototype.findUserAndSelect<T>>>;
	}

	async findUsersAndSelect<T extends keyof UserModel>(
		select: T,
		where: Prisma.UserModelWhereInput
	): Promise<{ [key: string]: UserModel[T] }[]> {
		return (await this.database.client.userModel.findMany({ where, select: { [select]: true } })) as unknown as Awaited<
			ReturnType<typeof UsersRepository.prototype.findUsersAndSelect<T>>
		>;
	}

	async getIdUsers(): Promise<number[]> {
		try {
			return (await this.database.client.userModel.findMany({ select: { id: true } })).map((user) => user.id);
		} catch (error) {
			return [];
		}
	}

	async findUsersForAdminPanel({ take, skip, q, sort }: GetUsersForAdminPanelDto): Promise<UserModelForAdmin[]> {
		try {
			const orderBy = (usersSorting.find((s) => s.id == sort) ?? usersSorting[0]).condition;
			const qIsNumber = !Number.isNaN(Number(q));
			return await this.database.client.userModel.findMany({
				where: {
					OR: [{ login: { contains: q } }, { email: { contains: q } }, qIsNumber ? { id: { equals: Math.floor(Number(q)) } } : {}]
				},
				take,
				skip,
				select: {
					id: true,
					email: true,
					login: true,
					avatar: true,
					role: true,
					rankId: true,
					userPoints: true,
					blocked: true,
					awardId: true,
					awardSelected: { select: { icon: true } }
				},
				orderBy
			});
		} catch (error) {
			return [];
		}
	}

	async findOtherUser(id: number): Promise<UserModelOther | null> {
		try {
			const user = await this.database.client.userModel.findUniqueOrThrow({
				where: { id },
				select: {
					awardsOpen: { select: { id: true } },
					avatar: true,
					id: true,
					watchedMinutes: true,
					rankId: true,
					awardId: true,
					login: true,
					userPoints: true,
					collections: {
						where: { private: { equals: false } },
						include: collectionIncludeConfig,
						take: 8,
						orderBy: { followers: { _count: 'desc' } }
					}
				}
			});
			const array: AttachedMoviesInCollection[] = [];
			for (const c of user.collections) {
				array.push({
					...c,
					preview: await this.collectionsRepository.attachMoviesToCollection(c.moviesId)
				});
			}
			return { ...user, collections: array };
		} catch (error) {
			return null;
		}
	}

	async deleteUser(email: string): Promise<UserModel | null>;
	async deleteUser(id: number): Promise<UserModel | null>;
	async deleteUser(emailOrId: string | number): Promise<UserModel | null> {
		try {
			if (typeof emailOrId == 'string') {
				return await this.database.client.userModel.delete({ where: { email: emailOrId } });
			}
			return await this.database.client.userModel.delete({ where: { id: emailOrId } });
		} catch (error) {
			error instanceof Error && this.logger.error(error.message);
			return null;
		}
	}

	async customRequest(filterOptions: Record<string, any>): Promise<UserModel[] | null> {
		try {
			return await this.database.client.userModel.findMany({ where: filterOptions });
		} catch (error) {
			return null;
		}
	}

	async addAwardByUserId(userId: number, awardId: number): Promise<void> {
		await this.database.client.userModel.update({
			where: { id: userId },
			data: { awardsOpen: { connect: { id: awardId } } }
		});
	}

	async getAwardsIdByUserId(id: number): Promise<number[]> {
		const awardsId = await this.database.client.userModel.findMany({
			where: { id },
			select: { awardsOpen: { select: { id: true } } }
		});
		return awardsId.flatMap((res) => res.awardsOpen.map((award) => award.id));
	}

	async hasMarkById(email: string, movieId: number): Promise<boolean> {
		try {
			const marks = (await this.database.client.userModel.findUnique({ where: { email }, select: { marks: true } }))?.marks;
			if (marks?.some((m) => m == movieId)) {
				return true;
			}
			return false;
		} catch (error) {
			return false;
		}
	}

	async addMark(email: string, movieId: number): Promise<number | null> {
		try {
			const user = await this.database.client.userModel.update({ where: { email }, data: { marks: { push: movieId } } });
			return user.marks.length;
		} catch (error) {
			return null;
		}
	}

	async getMarks(email: string): Promise<number[]> {
		return (await this.database.client.userModel.findUnique({ where: { email }, select: { marks: true } }))?.marks || [];
	}

	async removeMark(email: string, movieId: number): Promise<number | null> {
		try {
			const marks = (await this.getMarks(email)).filter((m) => m !== movieId);

			const user = await this.database.client.userModel.update({ where: { email }, data: { marks: { set: marks } } });
			return user.marks.length;
		} catch (error) {
			return null;
		}
	}

	async deleteEmptyUsers(): Promise<void> {
		try {
			const date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
			await this.database.client.userModel.deleteMany({ where: { verified: false, createdAt: { lte: date } } });
			this.logger.log('[ScheduleProccess] Неактивные пользователи удалены из базы данных');
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`[ScheduleProccess] Не удалось удалить неактивных пользователей. Ошибка: ${error.message}`);
			}
			return;
		}
	}

	async deleteBannedAccounts(): Promise<void> {
		try {
			const date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
			const { count } = await this.database.client.userModel.deleteMany({
				where: { updatedAt: { lte: date }, blocked: { equals: true } }
			});
			this.logger.log(`[ScheduleProccess] Из базы данных удалено ${count} заблокированных аккаунтов`);
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(
					`[ScheduleProccess] Не удалось удалить заблокированных пользователей из базы данных. Ошибка: ${error.message}`
				);
			}
		}
	}

	async getCountCollections(email: string): Promise<number> {
		try {
			const user = await this.database.client.userModel.findUnique({
				where: { email },
				select: { _count: { select: { collections: true } } }
			});
			if (!user) {
				return 0;
			}
			return user._count.collections;
		} catch (error) {
			return 0;
		}
	}

	async blockUserById(id: number, newLogin: string): Promise<null | (UserModel & { oldLogin?: string })> {
		try {
			const user = await this.database.client.userModel.findUnique({
				where: { id },
				select: { notificationToken: true, login: true }
			});
			return {
				...(await this.database.client.userModel.update({
					where: { id },
					data: {
						blocked: true,
						avatar: null,
						login: newLogin,
						notificationToken: user ? user.notificationToken.replace(user.login, newLogin) : undefined
					}
				})),
				oldLogin: user?.login
			};
		} catch (error) {
			return null;
		}
	}

	async unblockUserById(id: number): Promise<null | UserModel> {
		try {
			return await this.database.client.userModel.update({
				where: { id },
				data: { blocked: false }
			});
		} catch (error) {
			return null;
		}
	}

	async setViewToken(email: string, token: string): Promise<string | null> {
		try {
			return (await this.database.client.userModel.update({ where: { email }, data: { lastViewToken: token } })).lastViewToken;
		} catch (error) {
			return null;
		}
	}

	async addViewTime(email: string, minutes: number): Promise<number> {
		return (
			await this.database.client.userModel.update({
				where: { email },
				data: { watchedMinutes: { increment: minutes } },
				select: { watchedMinutes: true }
			})
		).watchedMinutes;
	}
}
