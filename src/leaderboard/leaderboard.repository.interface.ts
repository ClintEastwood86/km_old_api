import { Prisma, Rank, UserModel } from '@prisma/client';
import { LeaderboardSnapshotResult } from './leaderboard.interfaces';

export interface ILeaderboardRepository {
	getTopUsersNow(): Promise<(Pick<UserModel, 'id' | 'userPoints' | 'watchedMinutes'> & { rank: Pick<Rank, 'id'> })[]>;
	saveLeaderboardUsers(users: Prisma.LeaderboardUserSnapshotCreateManyInput[]): Promise<void>;
	getSnapshotByYear(year: number, reqUserId?: number): Promise<LeaderboardSnapshotResult>;
}
