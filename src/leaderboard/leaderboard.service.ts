import { inject, injectable } from 'inversify';
import { ILeaderboardService } from './leaderboard.service.interface';
import 'reflect-metadata';
import { TYPES } from '../types';
import { ILeaderboardRepository } from './leaderboard.repository.interface';
import { Prisma } from '@prisma/client';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';

@injectable()
export class LeaderboardService implements ILeaderboardService {
	constructor(@inject(TYPES.ILeaderboardRepository) private leaderboardRepository: ILeaderboardRepository) {}

	async createYearlySnapshot(year: number): Promise<void> {
		const existsSnapshot = await this.leaderboardRepository.getSnapshotByYear(year);
		if (existsSnapshot.top.length > 0) {
			throw new HTTPError(HttpStatus.CONFLICT, 'createYearlySnapshot', 'Конфликт', { error: 'Снимок этого года уже существует' });
		}

		const topUsers = await this.leaderboardRepository.getTopUsersNow();
		const usersForSave: Prisma.LeaderboardUserSnapshotCreateManyInput[] = topUsers.map((u, i) => ({
			minutesWatched: u.watchedMinutes,
			pointsAchieved: u.userPoints,
			position: i + 1,
			rankId: u.rank.id,
			userId: u.id,
			year
		}));
		this.leaderboardRepository.saveLeaderboardUsers(usersForSave);
	}
}
