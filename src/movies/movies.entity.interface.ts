import { Movie } from '../../prisma/generated/movies';
import { Professions } from '../enums/profession.enum';
import { MovieShort } from './movies.repository.interface';

export interface MovieMoreInfo extends Movie {
	countries: number[];
	genres: number[];
	similarMovies: MovieShort[];
	actors: {
		kinopoiskId: number;
		name: string;
		profession: Professions;
	}[];
}
