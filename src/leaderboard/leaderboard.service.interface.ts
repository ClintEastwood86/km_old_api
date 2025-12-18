export interface ILeaderboardService {
	createYearlySnapshot(year: number): Promise<void>;
}
