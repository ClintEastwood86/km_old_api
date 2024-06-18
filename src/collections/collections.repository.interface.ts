import { Collection } from '@prisma/client';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { AttachedMoviesInCollection, ReturnTypeActionCollection } from './collections.types';
import { MovieShort } from '../movies/movies.repository.interface';

export interface ICollectionsRepository {
	get(email: string, take: number, skip: number): Promise<AttachedMoviesInCollection[]>;
	create(dto: CreateCollectionDto, email: string): Promise<Collection | null>;
	change(dto: CreateCollectionDto, id: number): Promise<Collection | null>;
	findById(id: number): Promise<Collection | null>;
	getPaths(): Promise<number[]>;

	findPopularCollections(take: number, skip: number): Promise<AttachedMoviesInCollection[]>;
	findNewCollections(take: number, skip: number): Promise<AttachedMoviesInCollection[]>;
	findFollowerCollections(email: string, take: number, skip: number): Promise<AttachedMoviesInCollection[]>;
	findBestByMovieId(id: number): Promise<AttachedMoviesInCollection[]>;
	findByQuery(q: string, take: number): Promise<AttachedMoviesInCollection[]>;

	like(id: number, email: string): Promise<ReturnTypeActionCollection>;
	dislike(id: number, email: string): Promise<ReturnTypeActionCollection>;
	removeLike(id: number, email: string): Promise<ReturnTypeActionCollection>;
	unsubscribe(id: number, email: string): Promise<ReturnTypeActionCollection>;
	subscribe(id: number, email: string): Promise<ReturnTypeActionCollection>;
	setMovies(id: number, movies: number[]): Promise<Collection | null>;
	delete(id: number): Promise<Collection | null>;
	attachMoviesToCollection(array: number[]): Promise<MovieShort[]>;
}
