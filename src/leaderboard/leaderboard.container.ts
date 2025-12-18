import { ContainerModule, interfaces } from 'inversify';
import { TYPES } from '../types';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardRepository } from './leaderboard.repository';
import { ILeaderboardRepository } from './leaderboard.repository.interface';
import { LeaderboardService } from './leaderboard.service';
import { ILeaderboardService } from './leaderboard.service.interface';

export const leaderboardContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILeaderboardService>(TYPES.ILeaderboardService).to(LeaderboardService).inSingletonScope();
	bind<ILeaderboardRepository>(TYPES.ILeaderboardRepository).to(LeaderboardRepository).inSingletonScope();
	bind<LeaderboardController>(TYPES.LeaderboardController).to(LeaderboardController).inSingletonScope();
});
