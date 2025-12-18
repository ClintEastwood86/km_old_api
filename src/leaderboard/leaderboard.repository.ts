import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { CommonDatabase } from '../database/common.database';
import { ILoggerService } from '../logger/logger.service.interface';
import { ILeaderboardRepository } from './leaderboard.repository.interface';
import { Prisma, Rank, UserModel } from '@prisma/client';
import { LeaderboardSnapshotResult } from './leaderboard.interfaces';

@injectable()
export class LeaderboardRepository implements ILeaderboardRepository {
	constructor(
		@inject(TYPES.CommonDatabase) private database: CommonDatabase,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async getTopUsersNow(): Promise<(Pick<UserModel, 'id' | 'userPoints' | 'watchedMinutes'> & { rank: Pick<Rank, 'id'> })[]> {
		return await this.database.client.userModel.findMany({
			select: {
				id: true,
				userPoints: true,
				rank: {
					select: { id: true }
				},
				watchedMinutes: true
			},
			orderBy: [{ userPoints: 'desc' }, { id: 'asc' }]
		});
	}

	async saveLeaderboardUsers(users: Prisma.LeaderboardUserSnapshotCreateManyInput[]): Promise<void> {
		await this.database.client.leaderboardUserSnapshot.createMany({
			data: users
		});
	}

	async getSnapshotByYear(year: number, reqUserId?: number): Promise<LeaderboardSnapshotResult> {
		const top = await this.database.client.leaderboardUserSnapshot.findMany({
			omit: { createdAt: true, id: true, year: true },
			include: { user: { select: { login: true, avatar: true, rankId: true, awardSelected: { select: { icon: true } } } } },
			where: { year },
			orderBy: [{ position: 'asc' }],
			take: 50
		});
		const userResult = reqUserId
			? await this.database.client.leaderboardUserSnapshot.findUnique({
					where: { year_userId: { year, userId: reqUserId } }
			  })
			: undefined;

		return {
			year,
			top,
			user: userResult || undefined
		};
	}
}
