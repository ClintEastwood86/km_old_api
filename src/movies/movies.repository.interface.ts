import { HistoryItem, Player } from '@prisma/client';
import { Country, Genre, Movie } from '../../prisma/generated/movies';
import { MoviesSearchDto } from './dto/movies-search.dto';
import { MovieMoreInfo } from './movies.entity.interface';
import { SortMoviesEnumId } from '../enums/sort.enum';

export interface IMoviesRepository {
	getPlayers(): Promise<Player[]>;
	findPaths(): Promise<string[]>;
	findMovieByAlias(alias: string): Promise<Omit<MovieMoreInfo, 'players'> | null>;
	findAllGenres(): Promise<Genre[]>;
	findAllCountries(): Promise<Country[]>;
	findMovieById(id: number): Promise<Movie | null>;
	findMoviesByQuery(dto: MoviesSearchDto, take: number, skip: number): Promise<MovieShort[]>;
	findRandomMovie(): Promise<MovieShort>;
	findCurrentTop(take: number, skip: number): Promise<MovieShort[]>;
	isMovieExist(id: number): Promise<boolean>;
	findMoviesByArrayId(array: number[], take: number, skip: number, sort?: SortMoviesEnumId): Promise<MovieShort[]>;
	checkMoviesByArrayId(moviesId: number[]): Promise<number[]>;
	addHistoryRecord(email: string, token: string, movieId: number): Promise<HistoryItem>;
	getLastHistoryRecord(email: string): Promise<HistoryItem | null>;
}

export type MovieShort = Pick<
	Movie,
	'id' | 'poster' | 'secondPoster' | 'timeMinutes' | 'premiere' | 'alias' | 'nameOriginal' | 'nameRussian'
> & {
	genres: number[];
};
