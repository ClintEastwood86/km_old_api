import { inject, injectable } from 'inversify';
import { IMoviesRepository, MovieShort } from './movies.repository.interface';
import { TYPES } from '../types';
import { MoviesDatabase } from '../database/movies.database';
import { MovieMoreInfo } from './movies.entity.interface';
import { Genre, Country, Prisma, Movie } from '../../prisma/generated/movies';
import { MoviesSearchDto } from './dto/movies-search.dto';
import { SortMoviesEnumId, movieSorting } from '../enums/sort.enum';
import { ILoggerService } from '../logger/logger.service.interface';
import { moviesSelectConfig } from '../configs/movies-select.config';
import { CommonDatabase } from '../database/common.database';
import { HistoryItem } from '@prisma/client';

@injectable()
export class MoviesRepository implements IMoviesRepository {
	constructor(
		@inject(TYPES.MoviesDatabase) private database: MoviesDatabase,
		@inject(TYPES.CommonDatabase) private commonDatabase: CommonDatabase,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async findAllGenres(): Promise<Genre[]> {
		try {
			return await this.database.client.genre.findMany();
		} catch (error) {
			return [];
		}
	}

	async findAllCountries(): Promise<Country[]> {
		try {
			return await this.database.client.country.findMany();
		} catch (error) {
			return [];
		}
	}

	async findPaths(): Promise<string[]> {
		return (await this.database.client.movie.findMany({ select: { alias: true } })).map((a) => a.alias);
	}

	async findMovieByAlias(alias: string): Promise<MovieMoreInfo | null> {
		try {
			const movie = await this.database.client.movie.findUnique({
				where: { alias },
				include: {
					actors: { select: { kinopoiskId: true, name: true, profession: true } },
					countries: { select: { id: true } },
					genres: { select: { id: true } }
				}
			});
			if (!movie) {
				return movie;
			}
			return {
				...movie,
				genres: movie.genres.map((g) => g.id) as number[],
				countries: movie.countries.map((c) => c.id) as number[],
				actors: movie.actors
			};
		} catch (error) {
			return null;
		}
	}

	async findMovieById(id: number): Promise<Movie | null> {
		try {
			return await this.database.client.movie.findUnique({ where: { id } });
		} catch (error) {
			return null;
		}
	}

	async findMoviesByQuery(dto: MoviesSearchDto, take: number, skip: number): Promise<MovieShort[]> {
		try {
			const { sort, type, date_start, date_end, genre, country, q, skipAdultContent } = dto;

			const skipAdultContentObject: Prisma.Enumerable<Prisma.MovieWhereInput> = skipAdultContent
				? { genres: { none: { id: { equals: 29 } } } }
				: {};

			const movies = await this.database.client.movie.findMany({
				where: {
					AND: [
						{
							OR: [{ premiere: { gte: date_start, lte: date_end } }, { premiere: { equals: null } }]
						},
						{
							OR: [
								{ nameOriginal: { contains: q, mode: Prisma.QueryMode.insensitive } },
								{ nameRussian: { contains: q, mode: Prisma.QueryMode.insensitive } },
								{ alias: { equals: q, mode: Prisma.QueryMode.insensitive } }
							]
						},
						skipAdultContentObject
					],
					countries: { some: { id: { in: country } } },
					genres: { some: { id: { in: genre } } },
					// premiere: { gte: date_start, lte: date_end },
					type: { equals: type }
				},
				select: moviesSelectConfig,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				orderBy: [movieSorting.find((s) => s.id == sort)!.condition, { id: 'desc' }],
				take,
				skip
			});
			return movies.map((m) => {
				return {
					...m,
					genres: m.genres.map((g) => g.id) as number[]
				};
			});
		} catch (error) {
			return [];
		}
	}

	async findCurrentTop(take: number, skip: number): Promise<MovieShort[]> {
		try {
			const response = await this.database.client.popular.findFirst({
				select: {
					movies: true
				},
				orderBy: { date: 'desc' }
			});
			if (!response?.movies.length) {
				return [];
			}
			return this.findMoviesByArrayId(response.movies, take, skip);
		} catch (error) {
			return [];
		}
	}

	async isMovieExist(id: number): Promise<boolean> {
		try {
			await this.database.client.movie.findUniqueOrThrow({ where: { id } });
			return true;
		} catch (error) {
			return false;
		}
	}

	async findRandomMovie(): Promise<MovieShort> {
		const maxMovieId = (await this.database.client.movie.findFirst({ orderBy: { id: 'desc' } }))?.id;
		if (!maxMovieId) {
			this.logger.error('[moviesRepository] Ошибка при получении рандомного фильма');
			return await this.findRandomMovie();
		}
		const randInt = Math.floor(Math.random() * (maxMovieId - 1) + 1);
		const movie = await this.database.client.movie.findFirst({
			where: { genres: { none: { id: 29 } }, id: randInt },
			select: moviesSelectConfig
		});
		if (!movie) {
			return await this.findRandomMovie();
		}
		return { ...movie, genres: movie.genres.map((g) => g.id) };
	}

	async findMoviesByArrayId(array: number[], take: number, skip: number, sort?: SortMoviesEnumId): Promise<MovieShort[]> {
		const moviesId = typeof sort == 'number' ? array : array.slice(skip, skip + take);
		const movies = await this.database.client.movie.findMany({
			where: { id: { in: moviesId } },
			select: moviesSelectConfig,
			orderBy: movieSorting.find((s) => s.id == (sort ?? SortMoviesEnumId.PremiereDesc))?.condition
		});
		const moviesWithGenres = movies.map((m) => {
			return {
				...m,
				genres: m.genres.map((g) => g.id)
			};
		});

		return typeof sort == 'number'
			? moviesWithGenres
			: moviesWithGenres.sort((a, b) => moviesId.findIndex((id) => id == a.id) - moviesId.findIndex((id) => id == b.id));
	}

	async checkMoviesByArrayId(moviesId: number[]): Promise<number[]> {
		return (await this.database.client.movie.findMany({ where: { id: { in: moviesId } }, select: { id: true } })).map(
			(m) => m.id
		);
	}

	async addHistoryRecord(email: string, token: string, movieId: number): Promise<HistoryItem> {
		return await this.commonDatabase.client.historyItem.create({ data: { user: { connect: { email } }, token, movieId } });
	}

	async getLastHistoryRecord(email: string): Promise<HistoryItem | null> {
		return await this.commonDatabase.client.historyItem.findFirst({ where: { user: { email } }, orderBy: { createdAt: 'desc' } });
	}
}
