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
import { ICacheService } from '../cache/cache.service.interface';
import { Movie } from '../../prisma/generated/movies';
import { objectToSearchParams } from '../helpers/object-to-params';

@injectable()
export class MoviesController extends BaseController {
	private limitMoviesPerRequest: number;

	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IMoviesService) private moviesService: IMoviesService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.ICommentsRepository) private commentsRepository: ICommentRepository,
		@inject(TYPES.CacheService) private cache: ICacheService
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

	async getPaths(_: Request, res: Response): Promise<void> {
		const cacheKey = 'movies:paths';
		const cachedResult = await this.cache.get<string[]>(cacheKey).catch(() => null);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}
		const result = await this.moviesService.getPaths();
		this.cache.set(cacheKey, result, 1000 * 60 * 30).catch(() => null);
		this.ok(res, result);
	}

	async getMovieByAlias({ params: { alias } }: Request, res: Response, next: NextFunction): Promise<void> {
		const cacheKey = `movies:alias:${alias}`;
		const cachedResult = await this.cache.get<Movie>(cacheKey).catch(() => null);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}
		const movieOrError = await this.moviesService.getMovieByAlias(alias);
		if (movieOrError instanceof Error) {
			return next(movieOrError);
		}
		this.cache.set(cacheKey, movieOrError, 1000 * 60).catch(() => null);
		this.ok(res, movieOrError);
	}

	async getAllGenres(req: Request, res: Response): Promise<void> {
		const cacheKey = 'movies:genres';
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}
		const genres = await this.moviesService.getAllGenres();
		this.cache.set(cacheKey, genres, 1000 * 120).catch(() => null);
		this.ok(res, genres);
	}

	async getAllCountries(req: Request, res: Response): Promise<void> {
		const cacheKey = 'movies:countries';
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}
		const countries = await this.moviesService.getAllCountries();
		this.cache.set(cacheKey, countries, 1000 * 120).catch(() => null);
		this.ok(res, countries);
	}

	async getMoviesByQuery({ body, query }: Request<{}, {}, MoviesSearchDto>, res: Response): Promise<void> {
		const take = Number(query.take) <= this.limitMoviesPerRequest ? Number(query.take) : this.limitMoviesPerRequest;
		const skip = Number(query.skip) || 0;

		const cacheKey = `movies:by-query:${objectToSearchParams({ ...body, take, skip })}`;
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}
		const movies = await this.moviesService.getMoviesByQuery(body, take, skip);
		this.ok(res, movies);

		this.cache.set(cacheKey, movies, 1000 * 60).catch(() => null);
	}

	async getCurrentTop({ query }: Request, res: Response, next: NextFunction): Promise<void> {
		const take = Number(query.take) <= this.limitMoviesPerRequest ? Number(query.take) : this.limitMoviesPerRequest;
		const skip = Number(query.skip) || 0;

		const cacheKey = `movies:top:${objectToSearchParams({ take, skip })}`;
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}
		const movies = await this.moviesService.getCurrentTop(take, skip);
		this.cache.set(cacheKey, movies, 1000 * 60).catch(() => null);
		this.ok(res, movies);
	}

	async getMarkedMovies({ user, query }: Request, res: Response): Promise<void> {
		let take = Number(query.take);
		let skip = Number(query.skip);

		if (Number.isNaN(take) || take <= 0 || take > this.limitMoviesPerRequest) take = this.limitMoviesPerRequest;
		if (Number.isNaN(skip) || skip < 0) skip = 0;

		const cacheKey = `movies:marked:${objectToSearchParams({ take, skip, user })}`;
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}

		const movies = await this.moviesService.getMarkedMovies(user, take, skip);
		this.cache.set(cacheKey, movies, 1000 * 60).catch(() => null);
		this.ok(res, movies);
	}

	async getMarkedMoviesId({ user }: Request, res: Response): Promise<void> {
		const cacheKey = `movies:marked-id:user:${user}`;
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			this.ok(res, cachedResult);
			return;
		}

		const movies = await this.moviesService.getMarkedMoviesId(user);
		this.cache.set(cacheKey, movies, 1000 * 60).catch(() => null);
		this.ok(res, movies);
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
