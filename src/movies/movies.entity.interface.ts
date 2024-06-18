import { Movie } from '../../prisma/generated/movies';
import { Professions } from '../enums/profession.enum';

export interface MovieMoreInfo extends Movie {
	countries: number[];
	genres: number[];
	actors: {
		kinopoiskId: number;
		name: string;
		profession: Professions;
	}[];
}
