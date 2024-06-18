import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { ILoggerService } from '../logger/logger.service.interface';
import { TYPES } from '../types';
import { NextFunction, Request, Response } from 'express';
import { IMoviesService } from './movies.service.interface';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { MoviesSearchDto } from './dto/movies-search.dto';
import { AuthGuard } from '../middlewares/auth.guard';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { IUsersService } from '../users/users.service.interface';
import { IConfigService } from '../configs/config.service.interface';
import { ICommentRepository } from '../comments/comments.repository.interface';
import { GetMoviesByArrayDto } from './dto/get-movie-by-array.dto';
import { movieSorting } from '../enums/sort.enum';

@injectable()
export class MoviesController extends BaseController {
	private limitMoviesPerRequest: number;

	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IMoviesService) private moviesService: IMoviesService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.ICommentsRepository) private commentsRepository: ICommentRepository
	) {
		super(logger);
		this.bindRoutes('movies', [
			{ method: 'get', path: '/paths', func: this.getPaths },
			{ method: 'get', path: '/get/:alias', func: this.getMovieByAlias },
			{ method: 'get', path: '/countries', func: this.getAllCountries },
			{ method: 'get', path: '/genres', func: this.getAllGenres },
			{ method: 'get', path: '/random', func: this.getRandomMovie },
			{ method: 'get', path: '/top', func: this.getCurrentTop },
			{
				method: 'get',
				path: '/marks',
				func: this.getMarkedMovies,
				middlewares: [new AuthMiddleware(configService), new AuthGuard(configService, usersService, logger)]
			},
			{
				method: 'get',
				path: '/marks/id',
				func: this.getMarkedMoviesId,
				middlewares: [new AuthMiddleware(configService), new AuthGuard(configService, usersService, logger)]
			},
			{
				method: 'post',
				path: '/search/byQuery',
				func: this.getMoviesByQuery,
				middlewares: [new ValidateMiddleware(MoviesSearchDto)]
			},
			{
				method: 'post',
				path: '/get/byArray',
				func: this.getMoviesByArrayId,
				middlewares: [new ValidateMiddleware(GetMoviesByArrayDto)]
			}
		]);
		this.limitMoviesPerRequest = Number(this.configService.get('LIMIT_MOVIES_PER_REQUEST')) || 25;
	}

	async getPaths(req: Request, res: Response): Promise<void> {
		this.ok(res, await this.moviesService.getPaths());
	}

	async getMovieByAlias({ params: { alias } }: Request, res: Response, next: NextFunction): Promise<void> {
		const movieOrError = await this.moviesService.getMovieByAlias(alias);
		if (movieOrError instanceof Error) {
			return next(movieOrError);
		}
		this.ok(res, movieOrError);
	}

	async getAllGenres(req: Request, res: Response): Promise<void> {
		this.ok(res, await this.moviesService.getAllGenres());
	}

	async getAllCountries(req: Request, res: Response): Promise<void> {
		this.ok(res, await this.moviesService.getAllCountries());
	}

	async getMoviesByQuery({ body, query }: Request<{}, {}, MoviesSearchDto>, res: Response): Promise<void> {
		const take = Number(query.take) <= this.limitMoviesPerRequest ? Number(query.take) : this.limitMoviesPerRequest;
		const skip = Number(query.skip) || 0;
		this.ok(res, await this.moviesService.getMoviesByQuery(body, take, skip));
	}

	async getCurrentTop({ query }: Request, res: Response, next: NextFunction): Promise<void> {
		const take = Number(query.take) <= this.limitMoviesPerRequest ? Number(query.take) : this.limitMoviesPerRequest;
		const skip = Number(query.skip) || 0;
		this.ok(res, await this.moviesService.getCurrentTop(take, skip));
	}

	async getMarkedMovies({ user, query }: Request, res: Response): Promise<void> {
		let take = Number(query.take);
		let skip = Number(query.skip);

		if (Number.isNaN(take) || take <= 0 || take > this.limitMoviesPerRequest) take = this.limitMoviesPerRequest;
		if (Number.isNaN(skip) || skip < 0) skip = 0;

		this.ok(res, await this.moviesService.getMarkedMovies(user, take, skip));
	}

	async getMarkedMoviesId({ user }: Request, res: Response): Promise<void> {
		this.ok(res, await this.moviesService.getMarkedMoviesId(user));
	}

	async getRandomMovie(req: Request, res: Response): Promise<void> {
		this.ok(res, await this.moviesService.getRandomMovie());
	}

	async getMoviesByArrayId(
		{ body: { movies, take, skip, sort } }: Request<{}, {}, GetMoviesByArrayDto>,
		res: Response
	): Promise<void> {
		if (typeof sort !== 'undefined' && !movieSorting.some((s) => s.id == Number(sort))) sort = undefined;
		this.ok(res, await this.moviesService.getMoviesByArrayId(Array.isArray(movies) ? movies : [movies], take, skip, sort));
	}
}
