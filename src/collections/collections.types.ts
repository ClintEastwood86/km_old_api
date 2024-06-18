import { Collection } from '@prisma/client';
import { MovieShort } from '../movies/movies.repository.interface';

export interface AttachedMoviesInCollection extends Collection {
	preview: MovieShort[];
}

export interface ReturnTypeActionCollection {
	likes: number[];
	dislikes: number[];
	followers: number[];
}
