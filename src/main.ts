import { Container, ContainerModule, interfaces } from 'inversify';
import { App } from './app';
import { ConfigService } from './configs/config.service';
import { CommonDatabase } from './database/common.database';
import { ExeptionFilter } from './errors/exeption.filter';
import { IExeptionFilter } from './errors/exeption.filter.interface';
import { FilesService } from './files/files.service';
import { IFilesService } from './files/files.service.interface';
import { LoggerService } from './logger/logger.service';
import { ILoggerService } from './logger/logger.service.interface';
import { pointsItemContainer } from './pointsItems/pointsItem.container';
import { ranksContainer } from './ranks/ranks.container';
import { TYPES } from './types';
import { usersContainer } from './users/users.container';
import { awardsContainer } from './awards/awards.container';
import { MoviesDatabase } from './database/movies.database';
import { moviesContainer } from './movies/movies.container';
import { IEmailService } from './email/email.service.interface';
import { EmailService } from './email/email.service';
import { IScheduleService } from './schedule/schedule.service.interface';
import { ScheduleService } from './schedule/schedule.service';
import { commentsContainer } from './comments/comments.container';
import { collectionsContainer } from './collections/collections.container';
import { bonusContainer } from './bonus/bonus.container';
import { leaderboardContainer } from './leaderboard/leaderboard.container';

type ReturnTypeBootstrap = {
	app: App;
	container: Container;
};

const appContainer = new ContainerModule((bind: interfaces.Bind) => {
	bind<App>(TYPES.Application).to(App).inSingletonScope();
	bind<IExeptionFilter>(TYPES.IExeptionFilter).to(ExeptionFilter).inSingletonScope();

	bind<ILoggerService>(TYPES.ILoggerService).to(LoggerService).inSingletonScope();
	bind<IFilesService>(TYPES.IFilesService).to(FilesService).inSingletonScope();
	bind<IEmailService>(TYPES.IEmailService).to(EmailService).inSingletonScope();
	bind<ConfigService>(TYPES.IConfigService).to(ConfigService).inSingletonScope();
	bind<IScheduleService>(TYPES.IScheduleService).to(ScheduleService).inSingletonScope();
	bind<CommonDatabase>(TYPES.CommonDatabase).to(CommonDatabase).inSingletonScope();
	bind<MoviesDatabase>(TYPES.MoviesDatabase).to(MoviesDatabase).inSingletonScope();
});

const bootstrap = async (): Promise<ReturnTypeBootstrap> => {
	const container = new Container();
	container.load(appContainer);
	container.load(usersContainer);
	container.load(ranksContainer);
	container.load(pointsItemContainer);
	container.load(awardsContainer);
	container.load(moviesContainer);
	container.load(commentsContainer);
	container.load(collectionsContainer);
	container.load(bonusContainer);
	container.load(leaderboardContainer);

	const app = container.get<App>(TYPES.Application);
	app.setGlobalPrefix('api');
	await app.init();

	return { app, container };
};

export const boot = bootstrap();
