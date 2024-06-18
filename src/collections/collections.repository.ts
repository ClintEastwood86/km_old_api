import { Collection } from '@prisma/client';
import { ICollectionsRepository } from './collections.repository.interface';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { CommonDatabase } from '../database/common.database';
import { ILoggerService } from '../logger/logger.service.interface';
import { IMoviesRepository, MovieShort } from '../movies/movies.repository.interface';
import { AttachedMoviesInCollection, ReturnTypeActionCollection } from './collections.types';
import { collectionIncludeConfig } from '../configs/collection-include.config';

@injectable()
export class CollectionsRepository implements ICollectionsRepository {
	constructor(
		@inject(TYPES.CommonDatabase) private database: CommonDatabase,
		@inject(TYPES.IMoviesRepository) private moviesRepository: IMoviesRepository,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async create({ name, color, description, private: isPrivate }: CreateCollectionDto, email: string): Promise<Collection | null> {
		try {
			return await this.database.client.collection.create({
				data: { name, description, color, private: isPrivate, creator: { connect: { email } } },
				include: { _count: { select: { dislikes: true, likes: true, followers: true } } }
			});
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`[CollectionsRepository] Ошибка при создании подборки ${error.message}`);
			}
			return null;
		}
	}

	async change({ name, color, description, private: isPrivate }: CreateCollectionDto, id: number): Promise<Collection | null> {
		try {
			return await this.database.client.collection.update({
				where: { id },
				data: { name, description, color, private: isPrivate },
				include: collectionIncludeConfig
			});
		} catch (error) {
			return null;
		}
	}

	async findById(id: number): Promise<Collection | null> {
		try {
			const collection = await this.database.client.collection.findUnique({
				where: { id },
				include: collectionIncludeConfig
			});
			if (!collection) return collection;
			const changedColection = {
				...collection,
				likes: collection.likes?.map((l) => l.id),
				dislikes: collection.dislikes?.map((dl) => dl.id),
				followers: collection.followers?.map((dl) => dl.id)
			};
			return changedColection;
		} catch (error) {
			return null;
		}
	}

	async getPaths(): Promise<number[]> {
		try {
			return (
				await this.database.client.collection.findMany({ where: { private: { equals: false } }, select: { id: true } })
			).map((obj) => obj.id);
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`[CollectionsRepository] Ошибка при получении путей. ${error.message}`);
			}
			return [];
		}
	}

	async findPopularCollections(take: number, skip: number): Promise<AttachedMoviesInCollection[]> {
		try {
			const collections = await this.database.client.collection.findMany({
				where: { private: { equals: false }, moviesId: { isEmpty: false } },
				take,
				skip,
				orderBy: [{ followers: { _count: 'desc' } }, { id: 'desc' }],
				include: collectionIncludeConfig
			});
			const array: AttachedMoviesInCollection[] = [];
			for (const c of collections) {
				array.push({
					...c,
					preview: await this.attachMoviesToCollection(c.moviesId)
				});
			}
			return array;
		} catch (error) {
			return [];
		}
	}

	async findNewCollections(take: number, skip: number): Promise<AttachedMoviesInCollection[]> {
		try {
			const collections = await this.database.client.collection.findMany({
				where: { private: { equals: false }, moviesId: { isEmpty: false } },
				take,
				skip,
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				include: collectionIncludeConfig
			});
			const array: AttachedMoviesInCollection[] = [];
			for (const c of collections) {
				array.push({
					...c,
					preview: await this.attachMoviesToCollection(c.moviesId)
				});
			}
			return array;
		} catch (error) {
			return [];
		}
	}

	async findFollowerCollections(email: string, take: number, skip: number): Promise<AttachedMoviesInCollection[]> {
		try {
			const collections = await this.database.client.collection.findMany({
				where: { followers: { some: { email } }, private: { equals: false } },
				take,
				skip,
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				include: collectionIncludeConfig
			});
			const array: AttachedMoviesInCollection[] = [];
			for (const c of collections) {
				array.push({
					...c,
					preview: await this.attachMoviesToCollection(c.moviesId)
				});
			}
			return array;
		} catch (error) {
			return [];
		}
	}

	async findByQuery(q: string, take: number): Promise<AttachedMoviesInCollection[]> {
		try {
			const collections = await this.database.client.collection.findMany({
				where: { private: { equals: false }, name: { mode: 'insensitive', contains: q }, moviesId: { isEmpty: false } },
				include: collectionIncludeConfig,
				take,
				orderBy: [{ likes: { _count: 'desc' } }, { id: 'desc' }]
			});
			const array: AttachedMoviesInCollection[] = [];
			for (const c of collections) {
				array.push({ ...c, preview: await this.attachMoviesToCollection(c.moviesId) });
			}
			return array;
		} catch (error) {
			return [];
		}
	}

	async findBestByMovieId(id: number): Promise<AttachedMoviesInCollection[]> {
		try {
			const collections = await this.database.client.collection.findMany({
				where: { moviesId: { hasSome: [id] }, private: { equals: false } },
				include: collectionIncludeConfig,
				take: 4,
				orderBy: [{ likes: { _count: 'desc' } }, { id: 'desc' }]
			});
			const array: AttachedMoviesInCollection[] = [];
			for (const c of collections) {
				array.push({
					...c,
					preview: await this.attachMoviesToCollection(c.moviesId)
				});
			}
			return array;
		} catch (error) {
			return [];
		}
	}

	async like(id: number, email: string): Promise<ReturnTypeActionCollection> {
		const result = await this.database.client.collection.update({
			where: { id },
			data: { likes: { connect: { email } }, dislikes: { disconnect: { email } } },
			select: { likes: { select: { id: true } }, dislikes: { select: { id: true } }, followers: { select: { id: true } } }
		});
		return {
			likes: result.likes.map((l) => l.id),
			dislikes: result.dislikes.map((dl) => dl.id),
			followers: result.followers.map((f) => f.id)
		};
	}

	async dislike(id: number, email: string): Promise<ReturnTypeActionCollection> {
		const result = await this.database.client.collection.update({
			where: { id },
			data: { dislikes: { connect: { email } }, likes: { disconnect: { email } } },
			select: { likes: { select: { id: true } }, dislikes: { select: { id: true } }, followers: { select: { id: true } } }
		});
		return {
			likes: result.likes.map((l) => l.id),
			dislikes: result.dislikes.map((dl) => dl.id),
			followers: result.followers.map((f) => f.id)
		};
	}

	async removeLike(id: number, email: string): Promise<ReturnTypeActionCollection> {
		const result = await this.database.client.collection.update({
			where: { id },
			data: { dislikes: { disconnect: { email } }, likes: { disconnect: { email } } },
			select: { likes: { select: { id: true } }, dislikes: { select: { id: true } }, followers: { select: { id: true } } }
		});
		return {
			likes: result.likes.map((l) => l.id),
			dislikes: result.dislikes.map((dl) => dl.id),
			followers: result.followers.map((f) => f.id)
		};
	}

	async subscribe(id: number, email: string): Promise<ReturnTypeActionCollection> {
		const result = await this.database.client.collection.update({
			where: { id },
			data: { followers: { connect: { email } } },
			select: { likes: { select: { id: true } }, dislikes: { select: { id: true } }, followers: { select: { id: true } } }
		});
		return {
			likes: result.likes.map((l) => l.id),
			dislikes: result.dislikes.map((dl) => dl.id),
			followers: result.followers.map((f) => f.id)
		};
	}

	async unsubscribe(id: number, email: string): Promise<ReturnTypeActionCollection> {
		const result = await this.database.client.collection.update({
			where: { id },
			data: { followers: { disconnect: { email } } },
			select: { likes: { select: { id: true } }, dislikes: { select: { id: true } }, followers: { select: { id: true } } }
		});
		return {
			likes: result.likes.map((l) => l.id),
			dislikes: result.dislikes.map((dl) => dl.id),
			followers: result.followers.map((f) => f.id)
		};
	}

	async setMovies(id: number, movies: number[]): Promise<Collection | null> {
		try {
			return await this.database.client.collection.update({
				where: { id },
				data: { moviesId: { set: movies } },
				include: collectionIncludeConfig
			});
		} catch (error) {
			return null;
		}
	}

	async delete(id: number): Promise<Collection | null> {
		try {
			return await this.database.client.collection.delete({
				where: { id },
				include: { _count: { select: { dislikes: true, likes: true, followers: true } } }
			});
		} catch (error) {
			return null;
		}
	}

	async get(email: string, take: number, skip: number): Promise<AttachedMoviesInCollection[]> {
		const collections = await this.database.client.collection.findMany({
			where: { creator: { email } },
			take,
			skip,
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			include: collectionIncludeConfig
		});
		const array = [];
		for (const c of collections) {
			array.push({
				...c,
				preview: await this.attachMoviesToCollection(c.moviesId)
			});
		}
		return array;
	}

	async attachMoviesToCollection(array: number[]): Promise<MovieShort[]> {
		return await this.moviesRepository.findMoviesByArrayId(array, 4, 0);
	}
}
