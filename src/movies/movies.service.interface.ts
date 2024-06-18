import { HistoryItem } from '@prisma/client';
import { Country, Genre, Movie } from '../../prisma/generated/movies';
import { HTTPError } from '../errors/http-error';
import { MoviesSearchDto } from './dto/movies-search.dto';
import { MovieShort } from './movies.repository.interface';
import { SortMoviesEnumId } from '../enums/sort.enum';

export interface IMoviesService {
	getPaths(): Promise<string[]>;
	getMovieByAlias(alias: string): Promise<Movie | HTTPError>;
	getAllGenres(): Promise<Genre[]>;
	getAllCountries(): Promise<Country[]>;
	getMovieById(id: number): Promise<Movie | null>;
	getMoviesByQuery(dto: MoviesSearchDto, take: number, skip: number): Promise<MovieShort[]>;
	getMarkedMovies(email: string, take: number, skip: number, sort?: SortMoviesEnumId): Promise<MovieShort[] | HTTPError>;
	getMarkedMoviesId(email: string): Promise<number[] | HTTPError>;
	getRandomMovie(): Promise<MovieShort>;
	getCurrentTop(take: number, skip: number): Promise<MovieShort[]>;
	getMoviesByArrayId(array: number[], take: number, skip: number, sort?: SortMoviesEnumId): Promise<MovieShort[]>;
	addHistoryRecord(email: string, token: string, movieId: number): Promise<HistoryItem>;
	getLastHistoryRecord(email: string): Promise<HistoryItem | null>;
}
