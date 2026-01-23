import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { IConfigService } from '../configs/config.service.interface';
import { AuthGuard } from '../middlewares/auth.guard';
import { IUsersService } from '../users/users.service.interface';
import { ValidateMiddleware } from '../middlewares/validate.middleware';
import { ICollectionsService } from './collections.service.interface';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { setDefaultQuery } from '../helpers/set-default-query';
import { CollectionCategory } from '../enums/collection.enum';
import { SetMoviesDto } from './dto/set-movies-dto';
import { FindCollectionsDto } from './dto/find-collections.dto';

@injectable()
export class CollectionsController extends BaseController {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.ICollectionsService) private collectionService: ICollectionsService
	) {
		super(logger);
		const authMiddleware = new AuthMiddleware(configService);
		const authGuard = new AuthGuard(configService, usersService, logger);
		this.bindRoutes('collections', [
			{
				path: '/create',
				method: 'post',
				func: this.createCollection,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(CreateCollectionDto)]
			},
			{
				path: '/change/:id',
				method: 'put',
				func: this.change,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(CreateCollectionDto)]
			},
			{
				path: '/get',
				method: 'get',
				func: this.getMyCollections,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/find',
				method: 'post',
				func: this.findByQuery,
				middlewares: [new ValidateMiddleware(FindCollectionsDto)]
			},
			{
				path: '/get/:id',
				method: 'get',
				func: this.getById
			},
			{
				path: '/paths',
				method: 'get',
				func: this.getPaths
			},
			{
				path: '/popular',
				method: 'get',
				func: this.getPopular
			},
			{
				path: '/new',
				method: 'get',
				func: this.getNew
			},
			{
				path: '/subscs',
				method: 'get',
				func: this.getSubscs,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/best/:id',
				method: 'get',
				func: this.getBest
			},
			{
				path: '/actions/:id/:actionId',
				method: 'put',
				func: this.setAction,
				middlewares: [authMiddleware, authGuard]
			},
			{
				path: '/movies/:id',
				method: 'post',
				func: this.setMovies,
				middlewares: [authMiddleware, authGuard, new ValidateMiddleware(SetMoviesDto)]
			},
			{
				path: '/delete/:id',
				method: 'delete',
				func: this.delete,
				middlewares: [authMiddleware, authGuard]
			}
		]);
	}

	async createCollection(
		{ body, user, log }: Request<{}, {}, CreateCollectionDto>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const collection = await this.collectionService.create(body, user, log);
		if (collection instanceof Error) {
			return next(collection);
		}
		this.create(res, collection);
	}

	async change({ params, body, user }: Request<any, {}, CreateCollectionDto>, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'change', 'В параметр id указали не число', {
					error: 'Параметр :id должен принимать число'
				})
			);
		}
		const collection = await this.collectionService.change(body, Math.floor(id), user);
		if (collection instanceof Error) {
			return next(collection);
		}
		this.ok(res, collection);
	}

	async getMyCollections({ user, query }: Request, res: Response): Promise<void> {
		const take = setDefaultQuery(Number(query.take), 8);
		const skip = Number(query.skip);
		const result = await this.collectionService.get(user, Math.floor(take), Number.isNaN(skip) ? 0 : Math.floor(skip));
		this.ok(res, result);
	}

	async findByQuery({ body: { q, take } }: Request<{}, {}, FindCollectionsDto>, res: Response): Promise<void> {
		this.ok(res, await this.collectionService.findByQuery(q, take));
	}

	async getById({ params, cookies }: Request, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'getById', 'В параметр id указали не число', {
					error: 'Параметр :id должен принимать число'
				})
			);
		}
		const token: string | undefined = cookies.accessToken;
		const collection = await this.collectionService.getById(Math.floor(id), token);
		if (collection instanceof Error) {
			return next(collection);
		}
		this.ok(res, collection);
	}

	async getPopular({ query }: Request, res: Response): Promise<void> {
		const take = setDefaultQuery(Number(query.take), 8);
		const skip = !Number.isNaN(Number(query.skip)) ? Number(query.skip) : 0;
		this.ok(res, await this.collectionService.getCollections(CollectionCategory.Popular, Math.floor(take), Math.floor(skip)));
	}

	async getNew({ query }: Request, res: Response): Promise<void> {
		const take = setDefaultQuery(Number(query.take), 8);
		const skip = !Number.isNaN(Number(query.skip)) ? Number(query.skip) : 0;
		this.ok(res, await this.collectionService.getCollections(CollectionCategory.New, Math.floor(take), Math.floor(skip)));
	}

	async getSubscs({ query, user }: Request, res: Response): Promise<void> {
		const take = setDefaultQuery(Number(query.take), 8);
		const skip = !Number.isNaN(Number(query.skip)) ? Number(query.skip) : 0;
		this.ok(res, await this.collectionService.getFollowerCollections(user, Math.floor(take), Math.floor(skip)));
	}

	async setAction({ params, user }: Request, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		const actionId = Number(params.actionId);
		if (Number.isNaN(id) || Number.isNaN(actionId)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'setAction', 'Параметры переданы неверно', {
					error: `В параметр id или actionId передано не число`
				})
			);
		}
		const result = await this.collectionService.useAction(Math.floor(id), Math.floor(actionId), user);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, result);
	}

	async setMovies({ body, user, params }: Request<any, {}, SetMoviesDto>, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		const movies = Array.isArray(body.movies) ? body.movies : [body.movies];
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'setMovies', 'Параметр передан неверно', {
					error: 'В параметр :id должно поступать число'
				})
			);
		}
		const result = await this.collectionService.setMovies(Math.floor(id), user, movies);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, result);
	}

	async delete({ user, params }: Request<any, {}, SetMoviesDto>, res: Response, next: NextFunction): Promise<void> {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			return next(
				new HTTPError(HttpStatus.BAD_REQUEST, 'setMovies', 'Параметр передан неверно', {
					error: 'В параметр :id должно поступать число'
				})
			);
		}
		const result = await this.collectionService.delete(id, user);
		if (result instanceof Error) {
			return next(result);
		}
		this.ok(res, result);
	}

	async getBest({ params }: Request, res: Response): Promise<void> {
		const movies = await this.collectionService.getBestById(Number(params.id));
		this.ok(res, movies);
	}

	async getPaths(req: Request, res: Response): Promise<void> {
		this.ok(res, await this.collectionService.getPaths());
	}
}
