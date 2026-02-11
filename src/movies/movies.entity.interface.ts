import { Player } from '@prisma/client';
import { Movie } from '../../prisma/generated/movies';
import { Professions } from '../enums/profession.enum';
import { MovieShort } from './movies.repository.interface';

export interface MovieMoreInfo extends Movie {
	countries: number[];
	genres: number[];
	similarMovies: MovieShort[];
	players: Player[];
	actors: {
		kinopoiskId: number;
		name: string;
		profession: Professions;
	}[];
}
