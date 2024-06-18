import { Collection, Role } from '@prisma/client';
import { ICollectionsService } from './collections.service.interface';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { HTTPError } from '../errors/http-error';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ICollectionsRepository } from './collections.repository.interface';
import { HttpStatus } from '../helpers/http-status';
import { IUsersService } from '../users/users.service.interface';
import { JwtPayload, verify } from 'jsonwebtoken';
import { IConfigService } from '../configs/config.service.interface';
import { ILoggerService } from '../logger/logger.service.interface';
import { CollectionCategory } from '../enums/collection.enum';
import { AttachedMoviesInCollection, ReturnTypeActionCollection } from './collections.types';
import { CollectionActions } from '../enums/action.enum';
import { IMoviesRepository } from '../movies/movies.repository.interface';

@injectable()
export class CollectionsService implements ICollectionsService {
	constructor(
		@inject(TYPES.ICollectionsRepository) private collectionsRepository: ICollectionsRepository,
		@inject(TYPES.IMoviesRepository) private moviesRepository: IMoviesRepository,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IConfigService) private configService: IConfigService,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async get(email: string, take: number, skip: number): Promise<AttachedMoviesInCollection[]> {
		return await this.collectionsRepository.get(email, take, skip);
	}

	async create(dto: CreateCollectionDto, email: string): Promise<Collection | HTTPError> {
		const countCollections = await this.usersService.getCountCollections(email);
		const LIMIT_COLLECTIONS_IN_ACCOUNT = Number(this.configService.get('LIMIT_COLLECTIONS_IN_ACCOUNT'));
		if (countCollections >= LIMIT_COLLECTIONS_IN_ACCOUNT) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'create', 'Превышен лимит', {
				error: `Максимальное кол-во подборок – ${LIMIT_COLLECTIONS_IN_ACCOUNT}`
			});
		}
		const collection = await this.collectionsRepository.create(dto, email);
		if (!collection) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'create', 'Ошибка на сервере', {
				error: 'Не удалось создать подборку, повторите позже'
			});
		}
		this.logger.log(`[CollectionsService] Создана подборка ${collection.name}`);
		return collection;
	}

	async change(dto: CreateCollectionDto, id: number, email: string): Promise<Collection | HTTPError> {
		const collection = await this.collectionsRepository.findById(id);
		if (!collection) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'change', 'Не найдено', { error: `Подборка с id ${id} не найдена` });
		}
		const user = await this.usersService.findUserByEmail(email);
		if (!user || user.id !== collection.creatorId) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'change', 'Запрещено', {
				error: 'Нет доступа для редактирования этой подборки'
			});
		}
		const changedCollection = await this.collectionsRepository.change(dto, id);
		if (!changedCollection) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'change', 'Ошибка на сервере', {
				error: 'Не удалось изменить подборку, повторите позже'
			});
		}
		return changedCollection;
	}

	async getPaths(): Promise<number[]> {
		return await this.collectionsRepository.getPaths();
	}

	async getById(id: number, token?: string): Promise<Collection | HTTPError> {
		const collection = await this.collectionsRepository.findById(id);
		if (!collection) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getById', 'Не найдено', { error: `Подборка с id ${id} не найдена` });
		}
		if (!collection.private) {
			return collection;
		}
		const forbiddenError = new HTTPError(HttpStatus.FORBIDDEN, 'getById', 'Запрещено', {
			error: `Создатель подборки ограничил просмотр для других`
		});
		if (!token) {
			return forbiddenError;
		}
		try {
			const payload = verify(token, this.configService.get('ACCESS_TOKEN_SECRET')) as JwtPayload;
			const user = await this.usersService.findUserByEmail(payload.email);
			if (!user || user.id !== collection.creatorId) {
				return forbiddenError;
			}
		} catch (error) {
			return forbiddenError;
		}
		return collection;
	}

	async getBestById(id: number): Promise<AttachedMoviesInCollection[]> {
		return await this.collectionsRepository.findBestByMovieId(id);
	}

	async findByQuery(q: string, take: number): Promise<AttachedMoviesInCollection[]> {
		return await this.collectionsRepository.findByQuery(q, take);
	}

	async getCollections(category: CollectionCategory, take: number, skip: number): Promise<AttachedMoviesInCollection[]> {
		switch (category) {
			case CollectionCategory.Popular:
				return await this.collectionsRepository.findPopularCollections(take, skip);
			case CollectionCategory.New:
				return await this.collectionsRepository.findNewCollections(take, skip);
			default:
				return [];
		}
	}

	async getFollowerCollections(email: string, take: number, skip: number): Promise<AttachedMoviesInCollection[]> {
		return await this.collectionsRepository.findFollowerCollections(email, take, skip);
	}

	async useAction(
		id: number,
		actionId: CollectionActions,
		email: string
	): Promise<ReturnTypeActionCollection | void | HTTPError> {
		const collection = await this.collectionsRepository.findById(id);
		if (!collection) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'useAction', 'Не найдено', { error: 'Подборка не найдена' });
		}
		if (collection.private) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'useAction', 'Приватная подборка', {
				error: 'Невозможно отреагировать на приватную подборку'
			});
		}
		const user = await this.usersService.findUserByEmail(email);
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'useAction', 'Пользователь не найден', {
				error: `Пользователь с email ${email} не найден`
			});
		}
		switch (actionId) {
			case CollectionActions.Like:
				return await this.collectionsRepository.like(id, email);
			case CollectionActions.Dislike:
				return await this.collectionsRepository.dislike(id, email);
			case CollectionActions.Empty:
				return await this.collectionsRepository.removeLike(id, email);
			case CollectionActions.Subscribe:
				if (user.id == collection.creatorId) {
					return new HTTPError(HttpStatus.FORBIDDEN, 'useAction', 'Запрещено', {
						error: `Запрещено подписываться на свои подборки`
					});
				}
				return await this.collectionsRepository.subscribe(id, email);
			case CollectionActions.Unsubscribe:
				return await this.collectionsRepository.unsubscribe(id, email);
			default:
				return new HTTPError(HttpStatus.BAD_REQUEST, 'useAction', 'Невозможно обработать запрос', {
					error: 'Запрашиваемое действие не найдено'
				});
		}
	}

	async setMovies(id: number, email: string, movies: number[]): Promise<HTTPError | Collection> {
		const LIMIT_MOVIES_IN_COLLECTION = Number(this.configService.get('LIMIT_MOVIES_IN_COLLECTION'));
		const collection = await this.collectionsRepository.findById(id);
		if (!collection) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'setMovies', 'Не найдено', { error: `Подборка с id ${id} не найдена` });
		}
		const user = await this.usersService.findUserByEmail(email);
		if (!user || user.id !== collection.creatorId) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'change', 'Запрещено', {
				error: 'Нет доступа для редактирования этой подборки'
			});
		}
		if (movies.length > LIMIT_MOVIES_IN_COLLECTION) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'setMovies', 'Превышен лимит', {
				error: `Максимальное количество фильмов в подборке – ${LIMIT_MOVIES_IN_COLLECTION}`
			});
		}
		if ((await this.moviesRepository.checkMoviesByArrayId(movies)).length !== movies.length) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'setMovies', 'Не найден фильм', {
				error: `Один или несколько фильмов не найдены, попробуйте еще раз`
			});
		}
		const result = await this.collectionsRepository.setMovies(id, movies);
		if (!result) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'setMovies', 'Ошибка на сервере', {
				error: 'Ошибка на сервере, попробуйте позже'
			});
		}
		return result;
	}

	async delete(id: number, email: string): Promise<Collection | HTTPError> {
		const collection = await this.collectionsRepository.findById(id);
		if (!collection) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'delete', 'Не найдено', { error: `Подборка с id ${id} не найдена` });
		}
		const user = await this.usersService.findUserByEmail(email);
		if (!user || (user.id !== collection.creatorId && user.role !== Role.ADMIN)) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'delete', 'Запрещено', {
				error: 'Нет доступа'
			});
		}
		const result = await this.collectionsRepository.delete(id);
		if (!result) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'delete', 'Ошибка на сервере', {
				error: 'Не удалось удалить подборку, повторите позже'
			});
		}
		return result;
	}
}
