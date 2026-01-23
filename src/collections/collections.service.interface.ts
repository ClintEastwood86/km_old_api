import { Collection } from '@prisma/client';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { HTTPError } from '../errors/http-error';
import { AttachedMoviesInCollection, ReturnTypeActionCollection } from './collections.types';
import { CollectionCategory } from '../enums/collection.enum';
import { CollectionActions } from '../enums/action.enum';
import { Logger } from 'pino';

export interface ICollectionsService {
	get(email: string, take: number, skip: number): Promise<AttachedMoviesInCollection[]>;
	create(dto: CreateCollectionDto, email: string, logger: Logger): Promise<Collection | HTTPError>;
	change(dto: CreateCollectionDto, id: number, email: string): Promise<Collection | HTTPError>;
	findByQuery(q: string, take: number): Promise<AttachedMoviesInCollection[]>;
	getById(id: number, token?: string): Promise<Collection | HTTPError>;
	getCollections(category: CollectionCategory, take: number, skip: number): Promise<AttachedMoviesInCollection[]>;
	getBestById(id: number): Promise<AttachedMoviesInCollection[]>;
	getFollowerCollections(email: string, take: number, skip: number): Promise<AttachedMoviesInCollection[]>;
	useAction(id: number, actionId: CollectionActions, email: string): Promise<ReturnTypeActionCollection | void | HTTPError>;
	setMovies(id: number, email: string, movies: number[]): Promise<HTTPError | Collection>;
	delete(id: number, email: string): Promise<Collection | HTTPError>;
	getPaths(): Promise<number[]>;
}
