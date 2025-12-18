import { Award, LeaderboardUserSnapshot, UserModel } from '@prisma/client';

export interface LeaderboardSnapshotResult {
	year: number;
	user?: LeaderboardUserSnapshot;
	top: (Omit<LeaderboardUserSnapshot, 'createdAt' | 'id' | 'year'> & {
		user: Pick<UserModel, 'login' | 'avatar' | 'rankId'> & { awardSelected?: Pick<Award, 'icon'> | null };
	})[];
}
