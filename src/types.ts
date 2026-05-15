export const TYPES = {
	Application: Symbol.for('Application'),
	IExeptionFilter: Symbol.for('IExeptionFilter'),

	CommonDatabase: Symbol.for('CommonDatabase'),
	MoviesDatabase: Symbol.for('MoviesDatabase'),
	CacheService: Symbol.for('CacheService'),

	ILoggerService: Symbol.for('ILoggerService'),
	IUsersService: Symbol.for('IUsersService'),
	IFilesService: Symbol.for('IFilesService'),
	IConfigService: Symbol.for('IConfigService'),
	IRanksService: Symbol.for('IRanksService'),
	IPointsItemService: Symbol.for('IPointsItemService'),
	IAwardsService: Symbol.for('IAwardsService'),
	IMoviesService: Symbol.for('IMoviesService'),
	IEmailService: Symbol.for('IEmailService'),
	IScheduleService: Symbol.for('IScheduleService'),
	ICommentsService: Symbol.for('ICommentsService'),
	ICollectionsService: Symbol.for('ICollectionsService'),
	IBonusService: Symbol.for('IBonusService'),
	IFeedbackService: Symbol.for('IFeedbackService'),

	IUsersRepository: Symbol.for('IUsersRepository'),
	IRanksRepository: Symbol.for('IRanksRepository'),
	IPointsItemRepository: Symbol.for('IPointsItemRepository'),
	IAwardsRepository: Symbol.for('IAwardsRepository'),
	ICommentsRepository: Symbol.for('ICommentsRepository'),
	IMoviesRepository: Symbol.for('IMoviesRepository'),
	ICollectionsRepository: Symbol.for('ICollectionsRepository'),
	IBonusRepository: Symbol.for('IBonusRepository'),

	AppController: Symbol.for('AppController'),
	UserController: Symbol.for('UserController'),
	RanksController: Symbol.for('RanksController'),
	PointsItemController: Symbol.for('PointsItemController'),
	AwardsController: Symbol.for('AwardsController'),
	MoviesController: Symbol.for('MoviesController'),
	CommentsController: Symbol.for('CommentsController'),
	CollectionsController: Symbol.for('CollectionsController'),
	BonusController: Symbol.for('BonusController'),
	FeedbackController: Symbol.for('FeedbackController'),

	ILeaderboardService: Symbol.for('ILeaderboardService'),
	ILeaderboardRepository: Symbol.for('ILeaderboardRepository'),
	LeaderboardController: Symbol.for('LeaderboardController'),

	MoviesWebSocketController: Symbol.for('MoviesWebSocketController')
} satisfies Record<string, symbol>;
