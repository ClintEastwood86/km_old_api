import { inject, injectable } from 'inversify';
import { IMoviesService } from './movies.service.interface';
import { TYPES } from '../types';
import { IMoviesRepository, MovieShort } from './movies.repository.interface';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { MovieMoreInfo } from './movies.entity.interface';
import { Country, Genre, Movie } from '../../prisma/generated/movies';
import { MoviesSearchDto } from './dto/movies-search.dto';
import { SortMoviesEnumId } from '../enums/sort.enum';
import { IUsersService } from '../users/users.service.interface';
import { IUsersRepository } from '../users/users.repository.interface';
import { HistoryItem, Player } from '@prisma/client';

@injectable()
export class MoviesService implements IMoviesService {
	private players: Player[] = [];

	constructor(
		@inject(TYPES.IMoviesRepository) private moviesRepository: IMoviesRepository,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IUsersRepository) private usersRepository: IUsersRepository
	) {}

	async getPaths(): Promise<string[]> {
		return this.moviesRepository.findPaths();
	}

	async getMovieByAlias(alias: string): Promise<MovieMoreInfo | HTTPError> {
		const movie = await this.moviesRepository.findMovieByAlias(alias);
		if (!movie) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getMovieByAlias', 'Не найдено', { error: `Фильм с alias ${alias} не найден` });
		}
		if (!this.players.length) {
			await this.updatePlayersData();
		}

		return { ...movie, players: this.players };
	}

	async getMovieById(id: number): Promise<Movie | null> {
		return this.moviesRepository.findMovieById(id);
	}

	async getAllCountries(): Promise<Country[]> {
		return this.moviesRepository.findAllCountries();
	}

	async getAllGenres(): Promise<Genre[]> {
		return this.moviesRepository.findAllGenres();
	}

	async getMoviesByQuery(dto: MoviesSearchDto, take: number, skip: number): Promise<MovieShort[]> {
		dto.date_end = dto.date_end && new Date(dto.date_end);
		dto.date_start = dto.date_start && new Date(dto.date_start);
		dto.sort = dto.sort ?? SortMoviesEnumId.PremiereDesc;
		dto.q = dto.q || '';

		if (!dto.date_end || (dto.date_end && dto.date_end.getTime() > Date.now())) {
			dto.date_end = new Date();
		}
		return this.moviesRepository.findMoviesByQuery(dto, take, skip);
	}

	async getCurrentTop(take: number, skip: number): Promise<MovieShort[]> {
		return this.moviesRepository.findCurrentTop(take, skip);
	}

	async getMarkedMovies(email: string, take: number, skip: number, sort?: SortMoviesEnumId): Promise<MovieShort[] | HTTPError> {
		const user = await this.usersService.searchUser(email, { context: 'getMarkedMovies' });
		if (user instanceof Error) {
			return user;
		}
		const moviesId = await this.usersRepository.getMarks(email);
		return this.moviesRepository.findMoviesByArrayId(moviesId, take, skip, sort);
	}

	async getMarkedMoviesId(email: string): Promise<number[] | HTTPError> {
		const user = await this.usersService.searchUser(email, { context: 'getMarkedMovies' });
		if (user instanceof Error) {
			return user;
		}
		return (await this.usersRepository.getMarks(email)).reverse();
	}

	async getRandomMovie(): Promise<MovieShort> {
		return this.moviesRepository.findRandomMovie();
	}

	async getMoviesByArrayId(array: number[], take: number, skip: number, sort?: SortMoviesEnumId): Promise<MovieShort[]> {
		return this.moviesRepository.findMoviesByArrayId(array, take, skip, sort);
	}

	async addHistoryRecord(email: string, token: string, movieId: number): Promise<HistoryItem> {
		return this.moviesRepository.addHistoryRecord(email, token, movieId);
	}

	async getLastHistoryRecord(email: string): Promise<HistoryItem | null> {
		return this.moviesRepository.getLastHistoryRecord(email);
	}

	async updatePlayersData(): Promise<Player[]> {
		const players = await this.moviesRepository.getPlayers();
		this.players = players;
		return players;
	}
}
