import express, { Express, Router } from 'express';
import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { ILoggerService } from './logger/logger.service.interface';
import { UsersController } from './users/users.controller';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { IExeptionFilter } from './errors/exeption.filter.interface';
import { join } from 'path';
import cors from 'cors';
import { Server } from 'http';
import { RanksController } from './ranks/ranks.controller';
import { PointsItemController } from './pointsItems/pointsItem.controller';
import { AwardsController } from './awards/awards.controller';
import { CommonDatabase } from './database/common.database';
import { MoviesDatabase } from './database/movies.database';
import { MoviesController } from './movies/movies.controller';
import { IScheduleService } from './schedule/schedule.service.interface';
import { IUsersRepository } from './users/users.repository.interface';
import { CommentsController } from './comments/comments.controller';
import { CollectionsController } from './collections/collections.controller';
import { IRanksService } from './ranks/ranks.service.interface';
import { MoviesWebSocketController } from './movies/movies.websocket.controller';
import { BonusController } from './bonus/bonus.controller';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { AppController } from './app.controller';
import { setupExpressErrorHandler } from '@sentry/node';
import { sentryMiddleware } from './middlewares/sentry.middleware';

@injectable()
export class App {
	private port: number;
	private router: Router;
	private globalPrefix: string;

	public server: Server;
	public app: Express;

	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.AppController) private appController: AppController,
		@inject(TYPES.UserController) private usersController: UsersController,
		@inject(TYPES.RanksController) private ranksController: RanksController,
		@inject(TYPES.PointsItemController) private pointsItemController: PointsItemController,
		@inject(TYPES.IExeptionFilter) private exeptionFilter: IExeptionFilter,
		@inject(TYPES.CommonDatabase) private commonDatabase: CommonDatabase,
		@inject(TYPES.MoviesDatabase) private moviesDatabase: MoviesDatabase,
		@inject(TYPES.AwardsController) private awardsController: AwardsController,
		@inject(TYPES.MoviesController) private moviesController: MoviesController,
		@inject(TYPES.BonusController) private bonusController: BonusController,
		@inject(TYPES.IScheduleService) private scheduleService: IScheduleService,
		@inject(TYPES.IUsersRepository) private usersRepository: IUsersRepository,
		@inject(TYPES.CommentsController) private commentsController: CommentsController,
		@inject(TYPES.CollectionsController) private collectionsController: CollectionsController,
		@inject(TYPES.IRanksService) private ranksService: IRanksService,
		@inject(TYPES.MoviesWebSocketController) private moviesWebSocketController: MoviesWebSocketController,
		@inject(TYPES.LeaderboardController) private leaderboardController: LeaderboardController
	) {
		this.port = 3000;
		this.app = express();
		this.router = Router();
		this.globalPrefix = '/api';
	}

	private useProcesses(): void {
		this.scheduleService.everyMonth('deleteEmptyUsers', this.usersRepository.deleteEmptyUsers.bind(this.usersRepository));
		this.scheduleService.everyMonth('deleteBannedUsers', this.usersRepository.deleteBannedAccounts.bind(this.usersRepository));
		this.scheduleService.everyDay(
			'addPointsToSubscribedUsers',
			this.ranksService.addPointsToSubscribedUsers.bind(this.ranksService)
		);
	}

	private useMiddlewares(): void {
		this.router.use(cors({ credentials: true, origin: ['http://localhost:3001', 'https://localhost', 'http://46.253.143.132'] }));
		this.router.use(json());
		this.app.use(loggerMiddleware);
		this.app.use(sentryMiddleware);
		this.router.use(cookieParser());
		this.app.use('/upload', express.static(join(__dirname + '/../upload')));
	}

	private useExeptionFilter(): void {
		this.router.use(this.exeptionFilter.catch.bind(this.exeptionFilter));
	}

	private useRoutes(): void {
		this.app.use('/', this.appController.router);
		this.router.use('/users', this.usersController.router);
		this.router.use('/ranks', this.ranksController.router);
		this.router.use('/points', this.pointsItemController.router);
		this.router.use('/awards', this.awardsController.router);
		this.router.use('/movies', this.moviesController.router);
		this.router.use('/comments', this.commentsController.router);
		this.router.use('/collections', this.collectionsController.router);
		this.router.use('/bonus', this.bonusController.router);
		this.router.use('/leaderboard', this.leaderboardController.router);
	}

	private useWebSocketEvents(): void {
		this.moviesWebSocketController.useEvents.call(this.moviesWebSocketController, this.server);
	}

	async init(): Promise<void> {
		await this.commonDatabase.connect();
		await this.moviesDatabase.connect();

		this.useRoutes();
		setupExpressErrorHandler(this.app);
		this.useMiddlewares();
		this.useExeptionFilter();

		this.app.use(this.globalPrefix, this.router);
		this.server = this.app.listen(this.port, () => {
			this.logger.log('Сервер запущен на http://localhost:' + this.port);
		});

		this.useWebSocketEvents();
		this.useProcesses();
	}

	close(): void {
		this.server.close();
	}

	setGlobalPrefix(prefix: string): void {
		this.globalPrefix = '/' + prefix;
	}
}
